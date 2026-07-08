import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() projectData: { name: string; objective: string; target_deadline: string },
  ) {
    return this.projectService.createProject(projectData);
  }

  @Post(':id/approve-plan')
  @HttpCode(HttpStatus.OK)
  async approvePlan(@Param('id') id: string) {
    return this.projectService.approvePlan(id);
  }

  @Post(':id/generate-plan')
  @HttpCode(HttpStatus.ACCEPTED)
  async generatePlan(@Param('id') id: string) {
    return this.projectService.generatePlan(id);
  }
}
