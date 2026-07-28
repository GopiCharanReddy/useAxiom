import { Controller, Get, Query, HttpCode, HttpStatus, Headers, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@useaxiom/database';

interface ActiveUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(
    @CurrentUser() user: ActiveUser,
    @Headers('x-organization-id') orgIdHeader?: string,
    @Query('timeframe') timeframe?: string,
  ) {
    const organizationId = user?.organizationId || orgIdHeader || '00000000-0000-0000-0000-000000000000';
    return this.analyticsService.getDashboard(organizationId, timeframe);
  }

  @Get('team-workload')
  @HttpCode(HttpStatus.OK)
  async getTeamWorkload(
    @CurrentUser() user: ActiveUser,
    @Headers('x-organization-id') orgIdHeader?: string,
  ) {
    const organizationId = user?.organizationId || orgIdHeader || '00000000-0000-0000-0000-000000000000';
    return this.analyticsService.getTeamWorkload(organizationId);
  }
}
