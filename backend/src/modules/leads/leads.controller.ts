import { Body, Controller, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { LeadsService } from './leads.service';

const COOKIE_NAME = 'advisorai_conversation_id';

interface CreateLeadRequestDto {
  messages?: Array<{ role: string; content: string }>;
  email?: string | null;
  name?: string | null;
  source?: string;
}

@Controller('api/public')
@SkipThrottle()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  async createLead(@Body() body: CreateLeadRequestDto, @Req() req: Request): Promise<{
    leadId: string;
    proposal: { starter: unknown; pro: unknown; enterprise: unknown };
  }> {
    const conversationId = req.cookies?.[COOKIE_NAME] ?? null;
    const result = await this.leadsService.createLeadFromPublic({
      messages: body.messages ?? [],
      email: body.email ?? null,
      name: body.name ?? null,
      source: body.source ?? undefined,
      conversationId,
    });
    return {
      leadId: result.leadId,
      proposal: result.proposal,
    };
  }
}
