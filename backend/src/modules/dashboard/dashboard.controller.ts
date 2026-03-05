import { Controller, Get, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DashboardService, type DashboardStats } from './dashboard.service';

@Controller('api/admin/dashboard')
@SkipThrottle()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Query('days') days?: string,
  ): Promise<DashboardStats> {
    const daysNum = days ? Math.min(Math.max(1, parseInt(days, 10)), 365) : 30;
    return this.dashboardService.getStats(daysNum);
  }
}
