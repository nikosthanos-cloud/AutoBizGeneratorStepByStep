import { Module } from '@nestjs/common';
import { AIIntegrationModule } from '../ai/ai-integration.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AIIntegrationModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
