import { Injectable, Logger } from '@nestjs/common';
import { BuildStatus } from '@prisma/client';
import { AIService } from '../ai/ai.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class BuildPromptService {
  private readonly logger = new Logger(BuildPromptService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Start build prompt production for a lead: calls AI to generate Markdown spec
   * (Technical Specs, User Stories, Style Guide), saves to build_prompts, sets lead status PROMPT_GENERATED.
   */
  async startForLead(leadId: string): Promise<{ id: string }> {
    const { buildPromptId } = await this.aiService.generateBuildPrompt(leadId);
    return { id: buildPromptId };
  }

  /**
   * Called when a lead is confirmed (e.g. from Stripe webhook). Ensures a build prompt exists,
   * then if BUILDER_ENDPOINT is set POSTs the prompt and records the result in builder_runs.
   */
  async generateAndSend(leadId: string): Promise<void> {
    let buildPrompt = await this.prisma.buildPrompt.findFirst({
      where: { leadId },
      orderBy: { created_at: 'desc' },
    });
    if (!buildPrompt) {
      const result = await this.aiService.generateBuildPrompt(leadId);
      buildPrompt = await this.prisma.buildPrompt.findUniqueOrThrow({
        where: { id: result.buildPromptId },
      });
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });
    const customerEmail = lead?.customer?.email;
    if (customerEmail && buildPrompt.content) {
      await this.emailService.sendCustomerBuildPrompt(customerEmail, buildPrompt.content);
    }

    const builderEndpoint = process.env.BUILDER_ENDPOINT?.trim();
    if (!builderEndpoint) {
      this.logger.log(`BUILDER_ENDPOINT not set; skipping POST for leadId=${leadId}`);
      return;
    }

    const startedAt = new Date();
    const run = await this.prisma.builderRun.create({
      data: {
        buildPromptId: buildPrompt.id,
        status: BuildStatus.RUNNING,
        input: buildPrompt.content ?? undefined,
        startedAt,
      },
    });

    try {
      const body = JSON.stringify({ prompt: buildPrompt.content ?? '', leadId, buildPromptId: buildPrompt.id });
      const response = await fetch(builderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const output = await response.text();
      const completedAt = new Date();
      const status = response.ok ? BuildStatus.COMPLETED : BuildStatus.FAILED;
      await this.prisma.builderRun.update({
        where: { id: run.id },
        data: { status, output: output || undefined, completedAt },
      });
      this.logger.log(
        `Builder run leadId=${leadId} runId=${run.id} status=${status} statusCode=${response.status}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const completedAt = new Date();
      await this.prisma.builderRun.update({
        where: { id: run.id },
        data: {
          status: BuildStatus.FAILED,
          output: message,
          completedAt,
        },
      });
      this.logger.warn(`Builder run failed leadId=${leadId} runId=${run.id} error=${message}`);
    }
  }
}
