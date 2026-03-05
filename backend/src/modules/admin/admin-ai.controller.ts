import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminRoleGuard } from '../../guards/admin-role.guard';
import {
  AdminAIService,
  type AIUsageLogDto,
  type PromptsDto,
} from './admin-ai.service';

@Controller('api/admin')
@SkipThrottle()
@UseGuards(AdminRoleGuard)
export class AdminAIController {
  constructor(private readonly adminAI: AdminAIService) {}

  @Get('ai-usage')
  async getAiUsage(
    @Query('limit') limit?: string,
  ): Promise<{ data: AIUsageLogDto[]; total: number }> {
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50;
    return this.adminAI.getLatestUsageLogs(limitNum);
  }

  @Get('settings/prompts')
  async getPrompts(): Promise<PromptsDto> {
    return this.adminAI.getPrompts();
  }

  @Put('settings/prompts')
  async updatePrompts(@Body() body: PromptsDto): Promise<PromptsDto> {
    return this.adminAI.updatePrompts({
      sales_assistant: body.sales_assistant ?? '',
      proposal_generator: body.proposal_generator ?? '',
    });
  }
}
