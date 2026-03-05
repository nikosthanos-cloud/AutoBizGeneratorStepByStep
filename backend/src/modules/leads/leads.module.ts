import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AIIntegrationModule } from '../ai/ai-integration.module';
import { BuildPromptsModule } from '../build-prompts/build-prompts.module';
import { LeadConfirmedListener } from './lead-confirmed.listener';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [EventEmitterModule, AIIntegrationModule, BuildPromptsModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadConfirmedListener],
})
export class LeadsModule {}
