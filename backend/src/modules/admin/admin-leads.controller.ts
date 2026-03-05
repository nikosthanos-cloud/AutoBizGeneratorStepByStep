import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { LeadStatus, SelectedPackage } from '@prisma/client';
import { AdminRoleGuard } from '../../guards/admin-role.guard';
import { AdminLeadsService, type AdminLeadsResponse } from './admin-leads.service';

@Controller('api/admin/leads')
@SkipThrottle()
@UseGuards(AdminRoleGuard)
export class AdminLeadsController {
  constructor(private readonly adminLeadsService: AdminLeadsService) {}

  @Get()
  async getLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('selected_package') selectedPackage?: string,
  ): Promise<AdminLeadsResponse> {
    const validStatuses = Object.values(LeadStatus) as string[];
    const validPackages = Object.values(SelectedPackage) as string[];
    return this.adminLeadsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status:
        status && validStatuses.includes(status) ? (status as LeadStatus) : undefined,
      selectedPackage:
        selectedPackage && validPackages.includes(selectedPackage)
          ? (selectedPackage as SelectedPackage)
          : undefined,
    });
  }
}
