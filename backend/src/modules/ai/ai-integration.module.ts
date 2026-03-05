import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { SystemPromptService } from './system-prompt.service';

@Module({
  providers: [AIService, SystemPromptService],
  exports: [AIService, SystemPromptService],
})
export class AIIntegrationModule {}
