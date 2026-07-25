import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Milestone } from '@useaxiom/database';
import { CreateMilestoneDto } from './dto/milestone.dto';
import { EventPublisherService } from '../communication/services/event-publisher.service';
import { NotificationEventType } from '../communication/events/notification-event.types';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

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

  async create(
    organizationId: string,
    projectId: string,
    dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    await this.checkProjectOwner(organizationId, projectId);
    const milestone = await this.prisma.milestone.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : null,
        project: {
          connect: { id: projectId },
        },
      },
      include: {
        project: true,
      },
    });

    await this.eventPublisher.publish({
      organizationId,
      actorId: organizationId,
      entityType: 'milestone',
      entityId: milestone.id,
      eventType: NotificationEventType.GOAL_CREATED,
      variables: {
        goalName: milestone.name,
        projectName: milestone.project.name,
        deadline: milestone.targetDeadline?.toDateString() ?? 'No deadline',
        portalLink: `${process.env.PORTAL_URL ?? 'https://app.useaxiom.com'}/projects/${projectId}`,
      },
    });

    return milestone;
  }

  async findAll(organizationId: string, projectId: string): Promise<Milestone[]> {
    await this.checkProjectOwner(organizationId, projectId);
    return this.prisma.milestone.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Milestone | null> {
    return this.prisma.milestone.findFirst({
      where: {
        id,
        project: {
          organizationId,
          deletedAt: null,
        },
      },
    });
  }
}
