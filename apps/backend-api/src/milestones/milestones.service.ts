import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Milestone } from '@useaxiom/database';
import { CreateMilestoneDto } from './dto/milestone.dto';

@Injectable()
export class MilestonesService {
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

  async create(
    organizationId: string,
    projectId: string,
    dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    await this.checkProjectOwner(organizationId, projectId);
    return this.prisma.milestone.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : null,
        project: {
          connect: { id: projectId },
        },
      },
    });
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
