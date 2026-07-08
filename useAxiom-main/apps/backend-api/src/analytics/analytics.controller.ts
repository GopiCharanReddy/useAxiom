import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(@Query('timeframe') timeframe?: string) {
    return this.analyticsService.getDashboard(timeframe);
  }

  @Get('team-workload')
  @HttpCode(HttpStatus.OK)
  async getTeamWorkload() {
    return this.analyticsService.getTeamWorkload();
  }
}
