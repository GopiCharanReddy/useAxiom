import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, Prisma } from '@useaxiom/database';
import type { ITaskCreateDto, ITaskUpdateDto } from '@useaxiom/types';

@Injectable()
export class TaskService {
  private validateStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) return;

    const allowedTransitions: Record<string, string[]> = {
      PROPOSED: ['PENDING'],
      PENDING: ['IN_PROGRESS'],
      IN_PROGRESS: ['BLOCKED', 'COMPLETED'],
      BLOCKED: ['IN_PROGRESS'],
      COMPLETED: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid task status transition from '${currentStatus}' to '${nextStatus}'.`,
      );
    }
  }

  private async hasCircularPath(
    currentId: string,
    targetId: string,
    visited: Set<string>,
  ): Promise<boolean> {
    if (currentId === targetId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const deps = await prisma.taskDependency.findMany({
      where: {
        task_id: currentId,
        prerequisite: {
          deleted_at: null,
        },
      },
    });

    for (const dep of deps) {
      const found = await this.hasCircularPath(
        dep.depends_on_task_id,
        targetId,
        visited,
      );
      if (found) return true;
    }
    return false;
  }

  async createTask(organizationId: string, taskData: ITaskCreateDto) {
    const project = await prisma.project.findFirst({
      where: {
        id: taskData.project_id,
        organization_id: organizationId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${taskData.project_id} not found in this organization`,
      );
    }

    if (taskData.milestone_id) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: taskData.milestone_id,
          project_id: taskData.project_id,
          deleted_at: null,
        },
      });
      if (!milestone) {
        throw new NotFoundException(`Milestone not found in this project`);
      }
    }

    return prisma.task.create({
      data: {
        organization_id: organizationId,
        project_id: taskData.project_id,
        milestone_id: taskData.milestone_id || null,
        title: taskData.title,
        description: taskData.description,
        estimated_hours: new Prisma.Decimal(taskData.estimated_hours),
        created_by_ai: taskData.created_by_ai ?? false,
        status: 'PROPOSED',
      },
    });
  }

  async getTasks(
    organizationId: string,
    filter?: {
      project_id?: string;
      milestone_id?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      organization_id: organizationId,
      deleted_at: null,
    };

    if (filter?.project_id) {
      where.project_id = filter.project_id;
    }
    if (filter?.milestone_id) {
      where.milestone_id = filter.milestone_id;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getTaskById(organizationId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        organization_id: organizationId,
        deleted_at: null,
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async updateTask(
    organizationId: string,
    id: string,
    updateData: ITaskUpdateDto,
  ) {
    const task = await this.getTaskById(organizationId, id);

    if (updateData.status) {
      this.validateStatusTransition(task.status, updateData.status);

      if (updateData.status === 'IN_PROGRESS') {
        const blockedBy = await prisma.taskDependency.findMany({
          where: { task_id: id },
          include: { prerequisite: true },
        });

        const incomplete = blockedBy.filter(
          (dep) =>
            dep.prerequisite.status !== 'COMPLETED' &&
            dep.prerequisite.deleted_at === null,
        );
        if (incomplete.length > 0) {
          const names = incomplete
            .map((dep) => `'${dep.prerequisite.title}'`)
            .join(', ');
          throw new BadRequestException(
            `Cannot start task. It is blocked by incomplete prerequisite tasks: ${names}.`,
          );
        }
      }
    }

    const data: Prisma.TaskUpdateInput = {};
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined)
      data.description = updateData.description;
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.estimated_hours !== undefined) {
      data.estimated_hours = new Prisma.Decimal(updateData.estimated_hours);
    }
    if (updateData.milestone_id !== undefined) {
      data.milestone = updateData.milestone_id
        ? { connect: { id: updateData.milestone_id } }
        : { disconnect: true };
    }

    return prisma.task.update({
      where: { id },
      data,
    });
  }

  async softDeleteTask(organizationId: string, id: string) {
    await this.getTaskById(organizationId, id);
    return prisma.task.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async approveTask(
    organizationId: string,
    id: string,
    overrideData?: {
      assignee_id_override?: string;
      estimated_hours_override?: number;
    },
  ) {
    const task = await this.getTaskById(organizationId, id);

    this.validateStatusTransition(task.status, 'PENDING');

    const updatePayload: Prisma.TaskUpdateInput = { status: 'PENDING' };
    if (overrideData?.estimated_hours_override !== undefined) {
      updatePayload.estimated_hours = new Prisma.Decimal(
        overrideData.estimated_hours_override,
      );
    }

    if (overrideData?.assignee_id_override) {
      const user = await prisma.user.findFirst({
        where: {
          id: overrideData.assignee_id_override,
          organization_id: organizationId,
        },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${overrideData.assignee_id_override} not found in this organization`,
        );
      }

      await prisma.assignment.upsert({
        where: {
          task_id_user_id: {
            task_id: id,
            user_id: overrideData.assignee_id_override,
          },
        },
        update: {},
        create: {
          task_id: id,
          user_id: overrideData.assignee_id_override,
        },
      });
    }

    return prisma.task.update({
      where: { id },
      data: updatePayload,
    });
  }

  async assignTask(organizationId: string, taskId: string, userId: string) {
    await this.getTaskById(organizationId, taskId);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organization_id: organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this organization`,
      );
    }

    return prisma.assignment.upsert({
      where: {
        task_id_user_id: {
          task_id: taskId,
          user_id: userId,
        },
      },
      update: {},
      create: {
        task_id: taskId,
        user_id: userId,
      },
    });
  }

  async addDependency(
    organizationId: string,
    taskId: string,
    dependsOnTaskId: string,
  ) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const [task, prereq] = await Promise.all([
      this.getTaskById(organizationId, taskId),
      this.getTaskById(organizationId, dependsOnTaskId),
    ]);

    if (task.project_id !== prereq.project_id) {
      throw new BadRequestException('Tasks must belong to the same project');
    }

    const hasCycle = await this.hasCircularPath(
      dependsOnTaskId,
      taskId,
      new Set<string>(),
    );
    if (hasCycle) {
      throw new BadRequestException(
        `Adding dependency throws circular reference between Task ID '${taskId}' and '${dependsOnTaskId}'.`,
      );
    }

    return prisma.taskDependency.upsert({
      where: {
        task_id_depends_on_task_id: {
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
        },
      },
      update: {},
      create: {
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
      },
    });
  }

  async removeDependency(
    organizationId: string,
    taskId: string,
    dependsOnTaskId: string,
  ) {
    await this.getTaskById(organizationId, taskId);

    return prisma.taskDependency.delete({
      where: {
        task_id_depends_on_task_id: {
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
        },
      },
    });
  }

  async getDependencies(organizationId: string, taskId: string) {
    await this.getTaskById(organizationId, taskId);

    const [prerequisites, dependents] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { task_id: taskId },
        include: { prerequisite: true },
      }),
      prisma.taskDependency.findMany({
        where: { depends_on_task_id: taskId },
        include: { task: true },
      }),
    ]);

    return {
      prerequisites: prerequisites
        .filter((d) => d.prerequisite.deleted_at === null)
        .map((d) => d.prerequisite),
      dependents: dependents
        .filter((d) => d.task.deleted_at === null)
        .map((d) => d.task),
    };
  }
}
