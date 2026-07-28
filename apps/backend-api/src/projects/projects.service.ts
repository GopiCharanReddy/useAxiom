import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus } from '@useaxiom/database';
import { CreateProjectDto } from './dto/project.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { EventPublisherService } from '../communication/services/event-publisher.service';
import { NotificationEventType } from '../communication/events/notification-event.types';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('planner_jobs') private readonly plannerQueue: Queue,
    @InjectQueue('assignment_jobs') private readonly assignmentQueue: Queue,
    private readonly notificationsService: NotificationsService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(organizationId: string, managerId: string, dto: CreateProjectDto): Promise<any> {
    const project = await this.prisma.project.create({
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

    let notificationsSent = false;

    if (dto.employeeIds && dto.employeeIds.length > 0) {
      const memberPromises = dto.employeeIds.map(async (userId) => {
        let notificationStatus: string | null = null;
        if (dto.notifyEmployees) {
          try {
            const user = await this.prisma.user.findFirst({
              where: { id: userId, organizationId, deletedAt: null },
            });
            if (user && user.phoneNumber) {
              await this.notificationsService.sendProjectAssignedAlert(
                project.id,
                user.phoneNumber,
                project.name,
                project.targetDeadline?.toDateString() ?? 'No deadline',
                project.domain || 'Not specified',
                project.techStack,
                user.role || 'EMPLOYEE',
                project.createdAt.toDateString(),
                project.objective
              );
              notificationStatus = 'SENT';
            } else {
              notificationStatus = 'FAILED';
            }
          } catch (err) {
            console.error(`Failed to send notification to employee ${userId}:`, err);
            notificationStatus = 'FAILED';
          }
        }

        return this.prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            notificationStatus,
          },
        });
      });

      const members = await Promise.all(memberPromises);
      if (dto.notifyEmployees) {
        const hasFailures = members.some((m) => m.notificationStatus === 'FAILED');
        notificationsSent = !hasFailures;
      }
    }

    // Publish PROJECT_CREATED event after successful DB write
    await this.eventPublisher.publish({
      organizationId,
      actorId: managerId,
      entityType: 'project',
      entityId: project.id,
      eventType: NotificationEventType.PROJECT_CREATED,
      variables: {
        projectName: project.name,
        projectDescription: project.objective,
        deadline: project.targetDeadline?.toDateString() ?? 'No deadline',
        portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${project.id}`,
      },
    });

    return {
      ...project,
      notificationsSent,
    };
  }

  async findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        objective: true,
        status: true,
        domain: true,
        techStack: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            userId: true,
          },
        },
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
    const updated = await this.prisma.project.update({
      where: { id },
      data: { status },
    });

    const eventType =
      status === ProjectStatus.COMPLETED
        ? NotificationEventType.PROJECT_COMPLETED
        : NotificationEventType.PROJECT_UPDATED;

    await this.eventPublisher.publish({
      organizationId,
      actorId: project.managerId ?? organizationId,
      entityType: 'project',
      entityId: id,
      eventType,
      variables: {
        projectName: project.name,
        status,
        portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${id}`,
      },
    });

    return updated;
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

    // Publish PROJECT_UPDATED event (status → ACTIVE)
    await this.eventPublisher.publish({
      organizationId,
      actorId: project.managerId ?? organizationId,
      entityType: 'project',
      entityId: id,
      eventType: NotificationEventType.PROJECT_UPDATED,
      variables: {
        projectName: project.name,
        status: 'ACTIVE',
        portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${id}`,
      },
    });

    return updatedProject;
  }

  async generatePlan(organizationId: string, id: string) {
    const project = await this.findOne(organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found under your organization`);
    }

    // Retrieve assigned project members or org employees to pair with tasks
    const projectMembers = await this.prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: true },
    });

    const orgEmployees = await this.prisma.user.findMany({
      where: { organizationId, role: 'EMPLOYEE', deletedAt: null },
    });

    const availableEmployees =
      projectMembers.length > 0
        ? projectMembers.map((m) => m.user)
        : orgEmployees;

    const domainStr = project.domain || 'Fullstack';
    const stackStr = project.techStack?.length ? project.techStack.join(', ') : 'TypeScript';
    const objStr = project.objective || project.name;

    const planMilestones = [
      {
        name: `Milestone 1: Scope & Architecture Specification (${domainStr})`,
        tasks: [
          {
            name: `Day 1: Technical Analysis & Data Modeling`,
            description: `Analyze business goals for "${objStr}". Define API endpoints, schema models, and tech stack parameters (${stackStr}).`,
            estimatedHours: 8,
          },
          {
            name: `Day 2: System Infrastructure & Security Setup`,
            description: `Establish core repository contracts, authentication guards, and database migrations for ${project.name}.`,
            estimatedHours: 8,
          },
        ],
      },
      {
        name: `Milestone 2: Capability Implementation & UI Integration`,
        tasks: [
          {
            name: `Day 3: Core API Capability & Business Logic`,
            description: `Implement business logic services, state handlers, and validation pipelines for "${objStr.slice(0, 50)}".`,
            estimatedHours: 8,
          },
          {
            name: `Day 4: User Interface & Workflow Integration`,
            description: `Build responsive UI components, real-time status management, and dashboard integration for ${project.name}.`,
            estimatedHours: 8,
          },
        ],
      },
      {
        name: `Milestone 3: Verification & Employee Dispatch`,
        tasks: [
          {
            name: `Day 5: Integration Testing & Alert Dispatch`,
            description: `Execute full integration test suites, verify API contract compliance, and dispatch employee notifications.`,
            estimatedHours: 8,
          },
        ],
      },
    ];

    // Wipe any older PROPOSED tasks for clean plan generation
    await this.prisma.task.deleteMany({
      where: { projectId: id, status: 'PROPOSED' },
    });

    const createdTasks = [];
    let empIdx = 0;

    for (const milestone of planMilestones) {
      const milestoneRecord = await this.prisma.milestone.create({
        data: {
          projectId: id,
          name: milestone.name,
          description: `Milestone for ${project.name}`,
        },
      });

      for (const taskItem of milestone.tasks) {
        const assignedEmp =
          availableEmployees.length > 0
            ? availableEmployees[empIdx % availableEmployees.length]
            : null;
        empIdx++;

        const newTask = await this.prisma.task.create({
          data: {
            title: taskItem.name,
            description: taskItem.description,
            estimatedHours: taskItem.estimatedHours,
            status: 'PROPOSED',
            projectId: id,
            organizationId: organizationId,
            milestoneId: milestoneRecord.id,
            createdByAi: true,
          },
        });

        if (assignedEmp) {
          await this.prisma.assignment.create({
            data: {
              taskId: newTask.id,
              userId: assignedEmp.id,
            },
          });
        }

        createdTasks.push({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          estimatedHours: Number(newTask.estimatedHours),
          status: newTask.status,
          assignedUser: assignedEmp ? assignedEmp.name : 'Unassigned',
        });
      }
    }

    return {
      message: 'Day-to-day plan generated successfully',
      projectId: id,
      tasksCount: createdTasks.length,
      tasks: createdTasks,
    };
  }

  async getProjectTasks(organizationId: string, projectId: string) {
    const project = await this.findOne(organizationId, projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found under your organization`);
    }
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: projectId,
        deletedAt: null,
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
        milestone: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : 8,
      assignedUser: t.assignments?.[0]?.user?.name || 'Unassigned',
      milestoneName: t.milestone?.name || 'General',
    }));
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

    // Publish EMPLOYEE_ADDED event (replaces direct notificationsService call with proper event)
    await this.eventPublisher.publish({
      organizationId,
      actorId: project.managerId ?? organizationId,
      entityType: 'project',
      entityId: projectId,
      eventType: NotificationEventType.EMPLOYEE_ADDED,
      variables: {
        employeeName: user.name,
        projectName: project.name,
        deadline: project.targetDeadline?.toDateString() ?? 'No deadline',
        portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${projectId}`,
      },
    });

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

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    const result = await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // Publish EMPLOYEE_REMOVED event
    if (user) {
      await this.eventPublisher.publish({
        organizationId,
        actorId: project.managerId ?? organizationId,
        entityType: 'project',
        entityId: projectId,
        eventType: NotificationEventType.EMPLOYEE_REMOVED,
        variables: {
          employeeName: user.name,
          projectName: project.name,
          portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${projectId}`,
        },
      });
    }

    return result;
  }
}
