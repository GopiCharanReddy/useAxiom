import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/assignment.dto';
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

@Controller('tasks/:taskId/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @CurrentUser() user: ActiveUser,
    @Param('taskId') taskId: string,
    @Body() body: CreateAssignmentDto,
  ) {
    return this.assignmentsService.assign(user.organizationId, taskId, body.userId);
  }

  @Delete(':userId')
  async unassign(
    @CurrentUser() user: ActiveUser,
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.assignmentsService.unassign(user.organizationId, taskId, userId);
  }

  @Get()
  async findAssignments(@CurrentUser() user: ActiveUser, @Param('taskId') taskId: string) {
    return this.assignmentsService.findAssignmentsForTask(user.organizationId, taskId);
  }
}
