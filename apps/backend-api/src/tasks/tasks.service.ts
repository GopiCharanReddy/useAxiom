import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task, TaskStatus } from '@useaxiom/database';
import { CreateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkProjectOwner(organizationId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found in your organization`);
    }
  }

  async create(organizationId: string, projectId: string, dto: CreateTaskDto): Promise<Task> {
    await this.checkProjectOwner(organizationId, projectId);

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: {
          id: dto.milestoneId,
          projectId,
        },
      });
      if (!milestone) {
        throw new BadRequestException(
          `Milestone with ID ${dto.milestoneId} does not belong to project ${projectId}`,
        );
      }
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: TaskStatus.PROPOSED,
        estimatedHours: dto.estimatedHours ? dto.estimatedHours : null,
        createdByAi: false,
        organizationId,
        project: {
          connect: { id: projectId },
        },
        ...(dto.milestoneId
          ? {
              milestone: {
                connect: { id: dto.milestoneId },
              },
            }
          : {}),
      },
    });
  }

  async findAll(organizationId: string, projectId: string): Promise<Task[]> {
    await this.checkProjectOwner(organizationId, projectId);
    return this.prisma.task.findMany({
      where: {
        projectId,
        organizationId,
        deletedAt: null,
      },
      include: {
        milestone: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        milestone: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(organizationId: string, id: string, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(organizationId, id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found under your organization`);
    }
    return this.prisma.task.update({
      where: { id },
      data: { status },
      include: {
        milestone: true,
      },
    });
  }

  async hasPath(startTaskId: string, targetTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue: string[] = [startTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetTaskId) {
        return true;
      }
      if (!visited.has(current)) {
        visited.add(current);
        const dependents = await this.prisma.taskDependency.findMany({
          where: {
            dependsOnTaskId: current,
          },
          select: {
            taskId: true,
          },
        });
        for (const dep of dependents) {
          if (!visited.has(dep.taskId)) {
            queue.push(dep.taskId);
          }
        }
      }
    }
    return false;
  }

  async addDependency(organizationId: string, taskId: string, dependsOnTaskId: string) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const task = await this.findOne(organizationId, taskId);
    const dependsOnTask = await this.findOne(organizationId, dependsOnTaskId);

    if (!task || !dependsOnTask) {
      throw new NotFoundException('One or both tasks not found under your organization');
    }

    // Check if dependency already exists
    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });
    if (existing) {
      return existing;
    }

    // Check for circular dependency: does a path exist from taskId to dependsOnTaskId?
    const createsCycle = await this.hasPath(taskId, dependsOnTaskId);
    if (createsCycle) {
      throw new BadRequestException(
        'Circular dependency detected: adding this would create a cycle',
      );
    }

    return this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });
  }

  async removeDependency(organizationId: string, taskId: string, dependsOnTaskId: string) {
    const task = await this.findOne(organizationId, taskId);
    if (!task) {
      throw new NotFoundException('Task not found under your organization');
    }

    const dependency = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });
    if (!dependency) {
      throw new NotFoundException('Dependency relationship not found');
    }

    return this.prisma.taskDependency.delete({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });
  }

  async getDependencies(organizationId: string, taskId: string) {
    const task = await this.findOne(organizationId, taskId);
    if (!task) {
      throw new NotFoundException('Task not found under your organization');
    }

    return this.prisma.taskDependency.findMany({
      where: {
        taskId,
      },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }
}
