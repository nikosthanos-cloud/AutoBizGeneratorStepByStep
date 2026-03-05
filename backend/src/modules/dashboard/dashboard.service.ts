import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

export interface DashboardStats {
  totalLeads: number;
  conversionRate: number;
  aiCost: number;
  activeBuilds: number;
  leadsPerDay: Array<{ date: string; count: number }>;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(days = 30): Promise<DashboardStats> {
    const [totalLeads, wonLeads, activeBuilds, aiCostResult, leadsByDay] =
      await Promise.all([
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { status: LeadStatus.WON } }),
        this.prisma.lead.count({
          where: { status: LeadStatus.SENT_TO_BUILDER },
        }),
        this.prisma.aIUsageLog.aggregate({
          _sum: { costEstimate: true },
        }),
        this.getLeadsPerDay(days),
      ]);

    const conversionRate =
      totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0;
    const aiCost = Math.round((aiCostResult._sum.costEstimate ?? 0) * 1000) / 1000;

    return {
      totalLeads,
      conversionRate,
      aiCost,
      activeBuilds,
      leadsPerDay: leadsByDay,
    };
  }

  private async getLeadsPerDay(days: number): Promise<Array<{ date: string; count: number }>> {
    const result = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >(Prisma.sql`
      SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::bigint AS count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY date_trunc('day', created_at)::date
      ORDER BY date ASC
    `);
    return result.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      count: Number(r.count),
    }));
  }
}
