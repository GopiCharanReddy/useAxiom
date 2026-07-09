import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private getOrgId(orgIdHeader?: string): string {
    return orgIdHeader || '00000000-0000-0000-0000-000000000000';
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(
    @Headers('x-organization-id') orgId: string,
    @Query('timeframe') timeframe?: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.analyticsService.getDashboard(organizationId, timeframe);
  }

  @Get('team-workload')
  @HttpCode(HttpStatus.OK)
  async getTeamWorkload(@Headers('x-organization-id') orgId: string) {
    const organizationId = this.getOrgId(orgId);
    return this.analyticsService.getTeamWorkload(organizationId);
  }
}
