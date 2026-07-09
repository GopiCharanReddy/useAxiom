import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string, timeframe: string = '7d') {
    const [activeProjects, blockedTasks, aiTasks, totalTasks] = await Promise.all([
      this.prisma.project.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          status: 'BLOCKED',
          deletedAt: null,
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          createdByAi: true,
          deletedAt: null,
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      active_projects: activeProjects,
      blocked_tasks: blockedTasks,
      ai_interventions_count: aiTasks,
      team_velocity: totalTasks > 0 ? Math.round((activeProjects / totalTasks) * 100) : 100,
      timeframe,
    };
  }

  async getTeamWorkload(organizationId: string) {
    const employees = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: 'EMPLOYEE',
        deletedAt: null,
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
        (a) => a.task.status === 'IN_PROGRESS' && a.task.deletedAt === null,
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
