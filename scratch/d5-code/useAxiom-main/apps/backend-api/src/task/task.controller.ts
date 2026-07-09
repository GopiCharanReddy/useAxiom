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
import { TaskService } from './task.service';
import type { ITaskCreateDto, ITaskUpdateDto } from '@useaxiom/types';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  private getOrgId(orgIdHeader?: string): string {
    return orgIdHeader || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Headers('x-organization-id') orgId: string,
    @Body() taskData: ITaskCreateDto,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.createTask(organizationId, taskData);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getTasks(
    @Headers('x-organization-id') orgId: string,
    @Query('project_id') projectId?: string,
    @Query('milestone_id') milestoneId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.getTasks(organizationId, {
      project_id: projectId,
      milestone_id: milestoneId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTaskById(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.getTaskById(organizationId, id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateTask(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body() updateData: ITaskUpdateDto,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.updateTask(organizationId, id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTask(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.softDeleteTask(organizationId, id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveTask(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body()
    overrideData?: {
      assignee_id_override?: string;
      estimated_hours_override?: number;
    },
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.approveTask(organizationId, id, overrideData);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.CREATED)
  async assignTask(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.assignTask(organizationId, id, body.userId);
  }

  @Post(':id/dependencies')
  @HttpCode(HttpStatus.CREATED)
  async addDependency(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Body() body: { dependsOnTaskId: string },
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.addDependency(
      organizationId,
      id,
      body.dependsOnTaskId,
    );
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  @HttpCode(HttpStatus.OK)
  async removeDependency(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.removeDependency(
      organizationId,
      id,
      dependsOnTaskId,
    );
  }

  @Get(':id/dependencies')
  @HttpCode(HttpStatus.OK)
  async getDependencies(
    @Headers('x-organization-id') orgId: string,
    @Param('id') id: string,
  ) {
    const organizationId = this.getOrgId(orgId);
    return this.taskService.getDependencies(organizationId, id);
  }
}
