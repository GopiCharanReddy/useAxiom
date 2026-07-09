import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';
import { CreateTaskDependencyDto } from './dto/task-dependency.dto';
import { Role } from '@useaxiom/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface ActiveUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: ActiveUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateTaskDto,
  ) {
    return this.tasksService.create(user.organizationId, projectId, body);
  }

  @Get('projects/:projectId/tasks')
  async findAll(@CurrentUser() user: ActiveUser, @Param('projectId') projectId: string) {
    return this.tasksService.findAll(user.organizationId, projectId);
  }

  @Get('tasks/:id')
  async findOne(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    const task = await this.tasksService.findOne(user.organizationId, id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  @Patch('tasks/:id/status')
  async updateStatus(
    @CurrentUser() user: ActiveUser,
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(user.organizationId, id, body.status);
  }

  @Post('tasks/:taskId/dependencies')
  @HttpCode(HttpStatus.CREATED)
  async addDependency(
    @CurrentUser() user: ActiveUser,
    @Param('taskId') taskId: string,
    @Body() body: CreateTaskDependencyDto,
  ) {
    return this.tasksService.addDependency(user.organizationId, taskId, body.dependsOnTaskId);
  }

  @Delete('tasks/:taskId/dependencies/:dependsOnTaskId')
  async removeDependency(
    @CurrentUser() user: ActiveUser,
    @Param('taskId') taskId: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.tasksService.removeDependency(user.organizationId, taskId, dependsOnTaskId);
  }

  @Get('tasks/:taskId/dependencies')
  async getDependencies(@CurrentUser() user: ActiveUser, @Param('taskId') taskId: string) {
    return this.tasksService.getDependencies(user.organizationId, taskId);
  }
}
