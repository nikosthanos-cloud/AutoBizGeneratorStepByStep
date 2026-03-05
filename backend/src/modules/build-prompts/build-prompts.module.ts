import { Module } from '@nestjs/common';
import { AIIntegrationModule } from '../ai/ai-integration.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BuildPromptService } from './build-prompt.service';

@Module({
  imports: [AIIntegrationModule, NotificationsModule],
  providers: [BuildPromptService],
  exports: [BuildPromptService],
})
export class BuildPromptsModule {}
