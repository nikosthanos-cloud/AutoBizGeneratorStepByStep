import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AIService } from '../ai/ai.service';
import type { ChatMessage } from '../ai/interfaces/chat-message.interface';

const TRANSCRIPT_MAX_ITEMS = 500;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * Process one user message: load or create conversation, append message, get AI reply,
   * persist transcript as JSONB. Returns content and conversationId (for cookie).
   */
  async processMessage(
    userMessage: string,
    conversationId?: string | null,
  ): Promise<{ content: string; conversationId: string }> {
    const trimmed = userMessage?.trim();
    if (!trimmed) {
      throw new Error('Message is required');
    }

    if (conversationId) {
      return this.continueConversation(conversationId, trimmed);
    }
    return this.startConversation(trimmed);
  }

  private async startConversation(userMessage: string): Promise<{ content: string; conversationId: string }> {
    const lead = await this.prisma.lead.create({
      data: { source: 'web_chat', status: 'NEW' },
    });
    const transcript: ChatMessage[] = [{ role: 'user', content: userMessage }];
    const content = await this.aiService.generateChatResponse(transcript, { leadId: lead.id });
    transcript.push({ role: 'assistant', content });

    const conversation = await this.prisma.conversation.create({
      data: {
        leadId: lead.id,
        transcriptJson: transcript as object,
      },
    });
    return { content, conversationId: conversation.id };
  }

  private async continueConversation(
    conversationId: string,
    userMessage: string,
  ): Promise<{ content: string; conversationId: string }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const existing = (conversation.transcriptJson as ChatMessage[] | null) ?? [];
    const transcript = [
      ...existing.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage },
    ].slice(-TRANSCRIPT_MAX_ITEMS) as ChatMessage[];
    const content = await this.aiService.generateChatResponse(transcript, {
      leadId: conversation.leadId,
    });
    transcript.push({ role: 'assistant', content });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { transcriptJson: transcript as object },
    });
    return { content, conversationId };
  }

  /** Legacy: no persistence, no cookie. Used when client sends full messages array. */
  async getChatReplyLegacy(messages: ChatMessage[]): Promise<string> {
    return this.aiService.generateChatResponse(messages);
  }
}
