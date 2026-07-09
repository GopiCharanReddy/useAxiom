import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Prisma } from '@useaxiom/database';
import type { IProjectCreateDto, IProjectUpdateDto } from '@useaxiom/types';

@Injectable()
export class ProjectService {
  async createProject(organizationId: string, projectData: IProjectCreateDto) {
    return prisma.project.create({
      data: {
        organization_id: organizationId,
        name: projectData.name,
        objective: projectData.objective,
        target_deadline: new Date(projectData.target_deadline),
      },
    });
  }

  async getProjects(
    organizationId: string,
    pagination?: { page?: number; limit?: number; status?: string },
  ) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      organization_id: organizationId,
      deleted_at: null,
    };

    if (pagination?.status) {
      where.status = pagination.status;
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getProjectById(organizationId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: {
        id,
        organization_id: organizationId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async updateProject(
    organizationId: string,
    id: string,
    updateData: IProjectUpdateDto,
  ) {
    await this.getProjectById(organizationId, id);

    const data: Prisma.ProjectUpdateInput = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.objective !== undefined)
      data.objective = updateData.objective;
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.target_deadline !== undefined) {
      data.target_deadline = new Date(updateData.target_deadline);
    }

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async softDeleteProject(organizationId: string, id: string) {
    await this.getProjectById(organizationId, id);

    return prisma.project.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async approvePlan(organizationId: string, id: string) {
    await this.getProjectById(organizationId, id);

    const project = await prisma.project.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await prisma.task.updateMany({
      where: {
        project_id: id,
        status: 'PROPOSED',
      },
      data: {
        status: 'PENDING',
      },
    });

    return project;
  }

  async generatePlan(organizationId: string, id: string) {
    await this.getProjectById(organizationId, id);
    return {
      message: 'Plan generation triggered',
      jobId: `job_${Math.random().toString(36).substr(2, 9)}`,
      projectId: id,
    };
  }

  async getProjectTasks(organizationId: string, projectId: string) {
    await this.getProjectById(organizationId, projectId);
    return prisma.task.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
      },
    });
  }

  async getProjectMilestones(organizationId: string, projectId: string) {
    await this.getProjectById(organizationId, projectId);
    return prisma.milestone.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
      },
    });
  }

  async createMilestone(
    organizationId: string,
    projectId: string,
    name: string,
  ) {
    await this.getProjectById(organizationId, projectId);
    return prisma.milestone.create({
      data: {
        project_id: projectId,
        name,
      },
    });
  }
}
