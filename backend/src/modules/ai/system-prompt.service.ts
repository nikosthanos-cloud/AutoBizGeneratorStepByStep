import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BUILD_PROMPT_SYSTEM_PROMPT } from './prompts/build-prompt.prompt';
import { PROPOSAL_SYSTEM_PROMPT } from './prompts/proposal.prompt';
import { SALES_ASSISTANT_SYSTEM_PROMPT } from './prompts/sales-assistant.prompt';

const DEFAULTS: Record<string, string> = {
  sales_assistant: SALES_ASSISTANT_SYSTEM_PROMPT,
  proposal_generator: PROPOSAL_SYSTEM_PROMPT,
  build_prompt: BUILD_PROMPT_SYSTEM_PROMPT,
};

@Injectable()
export class SystemPromptService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns prompt content from DB or default. Used by AIService so behavior updates without redeploy. */
  async getContent(slug: string): Promise<string> {
    const row = await this.prisma.systemPrompt.findUnique({
      where: { slug },
    });
    return row?.content ?? DEFAULTS[slug] ?? '';
  }
}
