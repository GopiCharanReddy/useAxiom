import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus } from '@useaxiom/database';
import { CreateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, managerId: string, dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        objective: dto.objective,
        targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : null,
        status: ProjectStatus.PLANNING,
        organization: {
          connect: { id: organizationId },
        },
        manager: {
          connect: { id: managerId },
        },
      },
    });
  }

  async findAll(organizationId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
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
}
