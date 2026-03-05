import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma, SelectedPackage } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

export interface AdminLeadsQuery {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  selectedPackage?: SelectedPackage;
}

export interface AdminLeadDto {
  id: string;
  status: string;
  source: string | null;
  selectedPackage: string | null;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
}

export interface AdminLeadsResponse {
  data: AdminLeadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminLeadsQuery): Promise<AdminLeadsResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.selectedPackage) where.selectedPackage = query.selectedPackage;

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            select: { name: true, email: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    const data: AdminLeadDto[] = leads.map((l) => ({
      id: l.id,
      status: l.status,
      source: l.source,
      selectedPackage: l.selectedPackage,
      createdAt: l.created_at.toISOString(),
      customerName: l.customer?.name ?? null,
      customerEmail: l.customer?.email ?? null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
