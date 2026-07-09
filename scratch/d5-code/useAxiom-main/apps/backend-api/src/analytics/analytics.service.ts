import { Injectable } from '@nestjs/common';
import { prisma } from '@useaxiom/database';

@Injectable()
export class AnalyticsService {
  async getDashboard(organizationId: string, timeframe: string = '7d') {
    const [activeProjects, blockedTasks, aiTasks, totalTasks] =
      await Promise.all([
        prisma.project.count({
          where: {
            organization_id: organizationId,
            status: 'ACTIVE',
            deleted_at: null,
          },
        }),
        prisma.task.count({
          where: {
            organization_id: organizationId,
            status: 'BLOCKED',
            deleted_at: null,
          },
        }),
        prisma.task.count({
          where: {
            organization_id: organizationId,
            created_by_ai: true,
            deleted_at: null,
          },
        }),
        prisma.task.count({
          where: {
            organization_id: organizationId,
            deleted_at: null,
          },
        }),
      ]);

    return {
      active_projects: activeProjects,
      blocked_tasks: blockedTasks,
      ai_interventions_count: aiTasks,
      team_velocity:
        totalTasks > 0 ? Math.round((activeProjects / totalTasks) * 100) : 100,
      timeframe,
    };
  }

  async getTeamWorkload(organizationId: string) {
    const employees = await prisma.user.findMany({
      where: {
        organization_id: organizationId,
        role: 'EMPLOYEE',
        deleted_at: null,
      },
      include: {
        assignments: {
          include: {
            task: true,
          },
        },
      },
    });

    const workloads = employees.map((emp) => {
      const activeTasks = emp.assignments.filter(
        (a) => a.task.status === 'IN_PROGRESS' && a.task.deleted_at === null,
      ).length;

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        active_tasks: activeTasks,
        capacity_percentage: Math.min(activeTasks * 25, 100),
      };
    });

    return { workloads };
  }
}
