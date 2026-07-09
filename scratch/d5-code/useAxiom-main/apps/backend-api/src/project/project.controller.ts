import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import type {
  IProjectCreateDto,
  IProjectUpdateDto,
  IMilestoneCreateDto,
} from '@useaxiom/types';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  private getOrgId(orgIdHeader?: string): string {
    return orgIdHeader || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Headers('x-organization-id') orgId: string,
    @Body() projectData: IProjectCreateDto,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.createProject(organizationId, projectData);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProjects(
    @Headers('x-organization-id') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.getProjects(organizationId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProjectById(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.getProjectById(organizationId, id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateProject(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body() updateData: IProjectUpdateDto,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.updateProject(organizationId, id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProject(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.softDeleteProject(organizationId, id);
  }

  @Post(':id/approve-plan')
  @HttpCode(HttpStatus.OK)
  async approvePlan(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.approvePlan(organizationId, id);
  }

  @Post(':id/generate-plan')
  @HttpCode(HttpStatus.ACCEPTED)
  async generatePlan(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.generatePlan(organizationId, id);
  }

  @Get(':id/tasks')
  @HttpCode(HttpStatus.OK)
  async getProjectTasks(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.getProjectTasks(organizationId, id);
  }

  @Get(':id/milestones')
  @HttpCode(HttpStatus.OK)
  async getProjectMilestones(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.getProjectMilestones(organizationId, id);
  }

  @Post(':id/milestones')
  @HttpCode(HttpStatus.CREATED)
  async createMilestone(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body() milestoneData: IMilestoneCreateDto,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.projectService.createMilestone(
      organizationId,
      id,
      milestoneData.name,
    );
  }
}
