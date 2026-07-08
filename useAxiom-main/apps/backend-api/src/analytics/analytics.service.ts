import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getDashboard(timeframe: string = '7d') {
    return {
      active_projects: 3,
      blocked_tasks: 1,
      ai_interventions_count: 5,
      team_velocity: 85,
      timeframe,
    };
  }

  async getTeamWorkload() {
    return {
      workloads: [
        { employee_id: 'emp_1', active_tasks: 2, capacity_percentage: 40 },
        { employee_id: 'emp_2', active_tasks: 4, capacity_percentage: 80 },
        { employee_id: 'emp_3', active_tasks: 0, capacity_percentage: 0 },
      ],
    };
  }
}
