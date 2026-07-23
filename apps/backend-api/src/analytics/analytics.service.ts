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
        department: true,
        assignments: {
          where: {
            task: {
              deletedAt: null,
            },
          },
          include: {
            task: true,
          },
        },
      },
    });

    const workloads = employees.map((emp) => {
      const activeTasks = emp.assignments.filter((a) => a.task.status === 'IN_PROGRESS');
      const queuedTasks = emp.assignments.filter((a) => a.task.status === 'PENDING');
      const blockedTasks = emp.assignments.filter((a) => a.task.status === 'BLOCKED');

      const activeCount = activeTasks.length;
      const queuedCount = queuedTasks.length;
      const blockedCount = blockedTasks.length;

      const capacity = Math.min(activeCount * 40 + queuedCount * 15 + blockedCount * 20, 100);

      const currentTaskName =
        activeCount > 0
          ? activeTasks[0].task.title
          : blockedCount > 0
            ? `${blockedTasks[0].task.title} (Blocked)`
            : queuedCount > 0
              ? queuedTasks[0].task.title
              : 'No active stream';

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        role: emp.department?.name || 'Execution Agent',
        avatar: emp.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2),
        load: capacity,
        active_tasks: activeCount,
        queued_tasks: queuedCount,
        blocked_tasks: blockedCount,
        status: 'active',
        current_task_name: currentTaskName,
      };
    });

    return { workloads };
  }
}
