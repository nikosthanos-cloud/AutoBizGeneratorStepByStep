import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConversationsService } from './conversations.service';

const COOKIE_NAME = 'advisorai_conversation_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface ChatBodyDto {
  /** Single new user message (preferred when using cookie). */
  message?: string;
  /** Full messages array (legacy; used when no cookie). */
  messages?: Array<{ role: string; content: string }>;
}

@Controller('api/public')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('chat')
  @Throttle({ short: { limit: 30, ttl: 60_000 }, medium: { limit: 80, ttl: 300_000 } })
  async chat(
    @Body() body: ChatBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ content: string; conversationId?: string }> {
    const conversationId = (req.cookies?.[COOKIE_NAME] ?? req.headers?.cookie?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1]) ?? null;

    if (body.message != null) {
      const result = await this.conversationsService.processMessage(body.message.trim(), conversationId);
      if (conversationId !== result.conversationId) {
        res.cookie(COOKIE_NAME, result.conversationId, {
          httpOnly: true,
          maxAge: COOKIE_MAX_AGE * 1000,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        });
      }
      return { content: result.content, conversationId: result.conversationId };
    }

    // Legacy: full messages array, no persistence
    const messages = (body.messages ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const content = await this.conversationsService.getChatReplyLegacy(messages);
    return { content };
  }
}
