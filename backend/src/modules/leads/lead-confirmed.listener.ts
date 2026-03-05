import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BuildPromptService } from '../build-prompts/build-prompt.service';

const LEAD_CONFIRMED_EVENT = 'lead.confirmed';

export interface LeadConfirmedPayload {
  leadId: string;
}

@Injectable()
export class LeadConfirmedListener {
  constructor(private readonly buildPromptService: BuildPromptService) {}

  @OnEvent(LEAD_CONFIRMED_EVENT)
  async handleLeadConfirmed(payload: LeadConfirmedPayload): Promise<void> {
    await this.buildPromptService.generateAndSend(payload.leadId);
  }
}
