import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Assignment } from '@useaxiom/database';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkTaskOwner(organizationId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found in your organization`);
    }
  }

  private async checkUserInOrg(organizationId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not belong to your organization`);
    }
  }

  async assign(organizationId: string, taskId: string, userId: string): Promise<Assignment> {
    await this.checkTaskOwner(organizationId, taskId);
    await this.checkUserInOrg(organizationId, userId);

    return this.prisma.assignment.upsert({
      where: {
        taskId_userId: { taskId, userId },
      },
      update: {},
      create: {
        task: {
          connect: { id: taskId },
        },
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async unassign(organizationId: string, taskId: string, userId: string): Promise<Assignment> {
    await this.checkTaskOwner(organizationId, taskId);

    const assignment = await this.prisma.assignment.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment not found for Task ${taskId} and User ${userId}`);
    }

    return this.prisma.assignment.delete({
      where: {
        taskId_userId: { taskId, userId },
      },
    });
  }

  async findAssignmentsForTask(organizationId: string, taskId: string): Promise<Assignment[]> {
    await this.checkTaskOwner(organizationId, taskId);
    return this.prisma.assignment.findMany({
      where: {
        taskId,
      },
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
    });
  }
}
