import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AIService } from '../ai/ai.service';
import type { ProposalPackagesDto } from '../ai/interfaces/proposal-packages.interface';

interface CreateLeadDto {
  messages: Array<{ role: string; content: string }>;
  email?: string | null;
  name?: string | null;
  source?: string;
  conversationId?: string | null;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * If conversationId (from cookie) is set: use existing lead, generate/return proposal.
   * Else: create lead + conversation from messages, generate proposal, return.
   */
  async createLeadFromPublic(dto: CreateLeadDto): Promise<{ leadId: string; proposal: ProposalPackagesDto }> {
    if (dto.conversationId) {
      return this.generateProposalForConversation(dto.conversationId);
    }
    return this.createNewLeadWithMessages(dto);
  }

  /** Use existing conversation (cookie); generate proposal for its lead. */
  private async generateProposalForConversation(conversationId: string): Promise<{ leadId: string; proposal: ProposalPackagesDto }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: { include: { proposal: true } } },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const leadId = conversation.leadId;
    if (conversation.lead.proposal) {
      const proposal = JSON.parse(conversation.lead.proposal.content ?? '{}') as ProposalPackagesDto;
      return { leadId, proposal };
    }
    const proposalPackages = await this.aiService.generateProposal(leadId);
    await this.prisma.proposal.create({
      data: { leadId, content: JSON.stringify(proposalPackages), version: 1 },
    });
    return { leadId, proposal: proposalPackages };
  }

  private async createNewLeadWithMessages(dto: CreateLeadDto): Promise<{ leadId: string; proposal: ProposalPackagesDto }> {
    let customerId: string | null = null;
    if (dto.email) {
      const customer = await this.prisma.customer.upsert({
        where: { email: dto.email },
        create: { email: dto.email, name: dto.name ?? undefined },
        update: { name: dto.name ?? undefined },
      });
      customerId = customer.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        customerId,
        source: dto.source ?? 'web_chat',
        status: 'NEW',
      },
    });

    const transcriptJson = dto.messages.map((m) => ({ role: m.role, content: m.content }));
    await this.prisma.conversation.create({
      data: {
        leadId: lead.id,
        transcriptJson: transcriptJson as object,
      },
    });

    const proposalPackages = await this.aiService.generateProposal(lead.id);
    await this.prisma.proposal.create({
      data: {
        leadId: lead.id,
        content: JSON.stringify(proposalPackages),
        version: 1,
      },
    });

    return { leadId: lead.id, proposal: proposalPackages };
  }
}
