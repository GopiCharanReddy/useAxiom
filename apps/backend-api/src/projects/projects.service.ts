import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus } from '@useaxiom/database';
import { CreateProjectDto } from './dto/project.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('planner_jobs') private readonly plannerQueue: Queue,
    @InjectQueue('assignment_jobs') private readonly assignmentQueue: Queue,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(organizationId: string, managerId: string, dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        objective: dto.objective,
        targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : null,
        status: ProjectStatus.PLANNING,
        domain: dto.domain || null,
        techStack: dto.techStack || [],
        organization: {
          connect: { id: organizationId },
        },
        manager: {
          connect: { id: managerId },
        },
        tasks: {
          create: (dto.tasks || []).map((task) => ({
            organizationId,
            title: task.title,
            description: task.description,
            estimatedHours: task.estimatedHours,
            status: 'PROPOSED',
          })),
        },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        members: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async updateStatus(organizationId: string, id: string, status: ProjectStatus): Promise<Project> {
    const project = await this.findOne(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found under your organization`);
    }
    return this.prisma.project.update({
      where: { id },
      data: { status },
    });
  }

  async softDeleteProject(organizationId: string, id: string) {
    const project = await this.findOne(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found under your organization`);
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async approvePlan(organizationId: string, id: string) {
    const project = await this.findOne(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found under your organization`);
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.task.updateMany({
      where: {
        projectId: id,
        status: 'PROPOSED',
      },
      data: {
        status: 'PENDING',
      },
    });

    // Enqueue assignment job to auto-assign PENDING tasks
    await this.assignmentQueue.add('assign-tasks', {
      projectId: id,
      tenantId: organizationId,
    });

    return updatedProject;
  }

  async generatePlan(organizationId: string, id: string) {
    const project = await this.findOne(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found under your organization`);
    }
    const jobId = `job_${Math.random().toString(36).substring(2, 11)}`;

    await this.plannerQueue.add('generate-plan', {
      projectId: id,
      objective: project.objective,
      tenantId: organizationId,
    });

    return {
      message: 'Plan generation triggered',
      jobId,
      projectId: id,
    };
  }

  async getProjectTasks(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }
    return this.prisma.task.findMany({
      where: {
        projectId: projectId,
        deletedAt: null,
      },
    });
  }

  async getProjectMilestones(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }
    return this.prisma.milestone.findMany({
      where: {
        projectId: projectId,
        deletedAt: null,
      },
    });
  }

  async assignMember(organizationId: string, projectId: string, userId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found under your organization`);
    }

    const member = await this.prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      update: {},
      create: {
        projectId,
        userId,
      },
    });

    const deadlineString = project.targetDeadline
      ? project.targetDeadline.toDateString()
      : 'No deadline set';
    await this.notificationsService.sendProjectAssignedAlert(
      projectId,
      user.phoneNumber,
      project.name,
      deadlineString,
      project.domain || 'Not specified',
      project.techStack,
    );

    return member;
  }

  async getMembers(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            employeeId: true,
            role: true,
          },
        },
      },
    });
  }

  async unassignMember(organizationId: string, projectId: string, userId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }

    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }
}
