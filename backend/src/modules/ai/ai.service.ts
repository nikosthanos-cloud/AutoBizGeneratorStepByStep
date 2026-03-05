import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma.service';
import { AIUsageType, LeadStatus } from '@prisma/client';
import type { ChatMessage } from './interfaces/chat-message.interface';
import type { ProposalPackagesDto } from './interfaces/proposal-packages.interface';
import { SystemPromptService } from './system-prompt.service';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/** Approximate cost per 1K tokens (USD) for OpenAI models - adjust per model. */
const COST_PER_1K_INPUT: Record<string, number> = {
  'gpt-4o': 2.5 / 1000,
  'gpt-4o-mini': 0.15 / 1000,
  'gpt-4-turbo': 10 / 1000,
  'gpt-3.5-turbo': 0.5 / 1000,
};
const COST_PER_1K_OUTPUT: Record<string, number> = {
  'gpt-4o': 10 / 1000,
  'gpt-4o-mini': 0.6 / 1000,
  'gpt-4-turbo': 30 / 1000,
  'gpt-3.5-turbo': 1.5 / 1000,
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const inCost = (COST_PER_1K_INPUT[model] ?? 0.001) * (promptTokens / 1000);
  const outCost = (COST_PER_1K_OUTPUT[model] ?? 0.002) * (completionTokens / 1000);
  return Math.round((inCost + outCost) * 1e6) / 1e6;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly proposalModel: string;
  private readonly buildPromptModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemPrompt: SystemPromptService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set; AI calls will fail.');
    }
    this.openai = new OpenAI({ apiKey: apiKey ?? '' });
    this.chatModel = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';
    this.proposalModel = process.env.OPENAI_PROPOSAL_MODEL ?? 'gpt-4o-mini';
    this.buildPromptModel = process.env.OPENAI_BUILD_PROMPT_MODEL ?? 'gpt-4o-mini';
  }

  /**
   * Generates the next assistant reply for the sales chat using the Sales Assistant system prompt.
   * Logs usage to ai_usage_logs (tokens, model, cost).
   */
  async generateChatResponse(
    transcript: ChatMessage[],
    options?: { leadId?: string | null; userId?: string | null },
  ): Promise<string> {
    const requestId = crypto.randomUUID();
    const systemContent = await this.systemPrompt.getContent('sales_assistant');
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...transcript.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const completion = await this.callWithRetry(() =>
      this.openai.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.7,
      }),
    );

    const choice = completion.choices[0];
    const content = choice?.message?.content ?? '';
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const costEstimate = estimateCost(this.chatModel, promptTokens, completionTokens);

    await this.logUsage({
      leadId: options?.leadId ?? undefined,
      userId: options?.userId ?? undefined,
      type: AIUsageType.CHAT,
      model: this.chatModel,
      promptTokens,
      completionTokens,
      totalTokens,
      costEstimate,
      requestId,
    });

    this.logger.log(
      `Chat response generated requestId=${requestId} tokens=${totalTokens} cost≈${costEstimate}`,
    );
    return content;
  }

  /**
   * Loads the lead's conversation transcript, sends it to the AI, and returns a JSON
   * with three packages: Starter, Pro, Enterprise.
   * Logs usage to ai_usage_logs.
   */
  async generateProposal(leadId: string): Promise<ProposalPackagesDto> {
    const requestId = crypto.randomUUID();

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversations: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const conversations = lead.conversations;
    if (!conversations.length) {
      throw new Error(`No conversations found for lead: ${leadId}`);
    }

    // Build full transcript text from all conversations' transcript_json
    const transcriptParts: string[] = [];
    for (const conv of conversations) {
      const transcript = conv.transcriptJson as Array<{ role: string; content: string }> | null;
      if (Array.isArray(transcript)) {
        for (const msg of transcript) {
          const role = msg.role ?? 'user';
          const content = typeof msg.content === 'string' ? msg.content : String(msg.content);
          transcriptParts.push(`${role.toUpperCase()}: ${content}`);
        }
      }
    }
    const fullTranscript =
      transcriptParts.length > 0
        ? transcriptParts.join('\n\n')
        : 'No transcript content available. Please provide a generic Starter/Pro/Enterprise proposal.';

    const userMessage = `Conversation transcript:\n\n${fullTranscript}\n\nGenerate the proposal JSON (only valid JSON, no other text).`;
    const proposalSystemContent = await this.systemPrompt.getContent('proposal_generator');

    const completion = await this.callWithRetry(() =>
      this.openai.chat.completions.create({
        model: this.proposalModel,
        messages: [
          { role: 'system', content: proposalSystemContent },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    );

    const rawContent = completion.choices[0]?.message?.content ?? '{}';
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const costEstimate = estimateCost(this.proposalModel, promptTokens, completionTokens);

    await this.logUsage({
      leadId,
      type: AIUsageType.PROPOSAL,
      model: this.proposalModel,
      promptTokens,
      completionTokens,
      totalTokens,
      costEstimate,
      requestId,
    });

    this.logger.log(
      `Proposal generated leadId=${leadId} requestId=${requestId} tokens=${totalTokens} cost≈${costEstimate}`,
    );

    const parsed = JSON.parse(rawContent) as ProposalPackagesDto;
    if (!parsed.starter || !parsed.pro || !parsed.enterprise) {
      throw new Error('Invalid proposal JSON: missing starter, pro, or enterprise');
    }
    return parsed;
  }

  /**
   * Collects lead data (problem_summary, selected_package, transcript), calls AI with
   * Build Prompt system prompt, returns Markdown (Technical Specs, User Stories, Style Guide).
   * Saves to build_prompts and sets lead status to PROMPT_GENERATED. Logs to ai_usage_logs.
   */
  async generateBuildPrompt(leadId: string): Promise<{ buildPromptId: string; content: string }> {
    const requestId = crypto.randomUUID();

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversations: { orderBy: { created_at: 'asc' } },
        proposal: true,
      },
    });

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const problemSummary = lead.problemSummary ?? this.deriveProblemSummary(lead.conversations);
    const selectedPackage = lead.selectedPackage ?? 'STARTER';
    const transcriptText = this.buildTranscriptText(lead.conversations);

    const userMessage = [
      '## Problem summary',
      problemSummary || '(Not provided; infer from conversation.)',
      '',
      '## Selected package',
      selectedPackage,
      '',
      '## Conversation transcript',
      transcriptText || '(No transcript.)',
      '',
      'Produce the full Markdown build specification document as specified in your instructions.',
    ].join('\n');

    const systemContent = await this.systemPrompt.getContent('build_prompt');

    const completion = await this.callWithRetry(() =>
      this.openai.chat.completions.create({
        model: this.buildPromptModel,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
      }),
    );

    const content = completion.choices[0]?.message?.content ?? '';
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const costEstimate = estimateCost(this.buildPromptModel, promptTokens, completionTokens);

    await this.logUsage({
      leadId,
      type: AIUsageType.BUILD_PROMPT,
      model: this.buildPromptModel,
      promptTokens,
      completionTokens,
      totalTokens,
      costEstimate,
      requestId,
    });

    const slug = `lead-${leadId}-${Date.now()}`;
    const name = `Build prompt – Lead ${leadId}`;
    const buildPrompt = await this.prisma.buildPrompt.create({
      data: {
        leadId,
        name,
        slug,
        content,
      },
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.PROMPT_GENERATED },
    });

    this.logger.log(
      `Build prompt generated leadId=${leadId} buildPromptId=${buildPrompt.id} tokens=${totalTokens} cost≈${costEstimate}`,
    );

    return { buildPromptId: buildPrompt.id, content };
  }

  private deriveProblemSummary(conversations: { transcriptJson: unknown }[]): string {
    const parts: string[] = [];
    for (const c of conversations) {
      const t = c.transcriptJson as Array<{ role: string; content: string }> | null;
      if (Array.isArray(t)) {
        for (const m of t) {
          if (m.role === 'user' && m.content) parts.push(m.content);
        }
      }
    }
    return parts.length > 0 ? parts.join('\n\n') : '';
  }

  private buildTranscriptText(conversations: { transcriptJson: unknown }[]): string {
    const lines: string[] = [];
    for (const c of conversations) {
      const t = c.transcriptJson as Array<{ role: string; content: string }> | null;
      if (Array.isArray(t)) {
        for (const m of t) {
          const role = m.role ?? 'user';
          const content = typeof m.content === 'string' ? m.content : String(m.content ?? '');
          lines.push(`${role.toUpperCase()}: ${content}`);
        }
      }
    }
    return lines.join('\n\n');
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`AI call attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${lastError.message}`);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        }
      }
    }
    throw lastError ?? new Error('AI call failed');
  }

  private async logUsage(params: {
    leadId?: string;
    userId?: string;
    type: AIUsageType;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimate: number;
    requestId: string;
  }): Promise<void> {
    await this.prisma.aIUsageLog.create({
      data: {
        leadId: params.leadId ?? null,
        userId: params.userId ?? null,
        type: params.type,
        model: params.model,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.totalTokens,
        costEstimate: params.costEstimate,
        requestId: params.requestId,
      },
    });
  }
}
