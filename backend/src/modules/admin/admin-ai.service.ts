import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SALES_ASSISTANT_SYSTEM_PROMPT } from '../ai/prompts/sales-assistant.prompt';
import { PROPOSAL_SYSTEM_PROMPT } from '../ai/prompts/proposal.prompt';

export const PROMPT_SLUGS = {
  SALES_ASSISTANT: 'sales_assistant',
  PROPOSAL_GENERATOR: 'proposal_generator',
} as const;

export interface AIUsageLogDto {
  id: string;
  type: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costEstimate: number | null;
  createdAt: string;
}

export interface PromptsDto {
  sales_assistant: string;
  proposal_generator: string;
}

@Injectable()
export class AdminAIService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestUsageLogs(limit = 50): Promise<{ data: AIUsageLogDto[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.aIUsageLog.findMany({
        orderBy: { created_at: 'desc' },
        take: limit,
      }),
      this.prisma.aIUsageLog.count(),
    ]);
    return {
      data: data.map((r) => ({
        id: r.id,
        type: r.type,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        totalTokens: r.totalTokens,
        costEstimate: r.costEstimate,
        createdAt: r.created_at.toISOString(),
      })),
      total,
    };
  }

  async getPrompts(): Promise<PromptsDto> {
    const defaults = this.getDefaultPrompts();
    const rows = await this.prisma.systemPrompt.findMany({
      where: {
        slug: { in: [PROMPT_SLUGS.SALES_ASSISTANT, PROMPT_SLUGS.PROPOSAL_GENERATOR] },
      },
    });
    const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.content]));
    return {
      sales_assistant: bySlug[PROMPT_SLUGS.SALES_ASSISTANT] ?? defaults.sales_assistant,
      proposal_generator: bySlug[PROMPT_SLUGS.PROPOSAL_GENERATOR] ?? defaults.proposal_generator,
    };
  }

  async updatePrompts(dto: PromptsDto): Promise<PromptsDto> {
    for (const [slug, content] of Object.entries(dto)) {
      await this.prisma.systemPrompt.upsert({
        where: { slug },
        create: { slug, content },
        update: { content },
      });
    }
    return this.getPrompts();
  }

  async getPromptBySlug(slug: string): Promise<string | null> {
    const row = await this.prisma.systemPrompt.findUnique({
      where: { slug },
    });
    return row?.content ?? null;
  }

  private getDefaultPrompts(): PromptsDto {
    return {
      sales_assistant: SALES_ASSISTANT_SYSTEM_PROMPT,
      proposal_generator: PROPOSAL_SYSTEM_PROMPT,
    };
  }
}
