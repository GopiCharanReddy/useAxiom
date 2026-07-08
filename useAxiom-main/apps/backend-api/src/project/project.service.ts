import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectService {
  async createProject(projectData: { name: string; objective: string; target_deadline: string }) {
    return {
      id: `proj_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PLANNING',
      ...projectData,
      createdAt: new Date().toISOString(),
    };
  }

  async approvePlan(id: string) {
    return {
      message: 'Plan approved successfully',
      projectId: id,
      approvedAt: new Date().toISOString(),
    };
  }

  async generatePlan(id: string) {
    return {
      message: 'Plan generation triggered',
      jobId: `job_${Math.random().toString(36).substr(2, 9)}`,
      projectId: id,
    };
  }
}
