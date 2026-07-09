import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/milestone.dto';
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
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post('projects/:projectId/milestones')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: ActiveUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(user.organizationId, projectId, body);
  }

  @Get('projects/:projectId/milestones')
  async findAll(@CurrentUser() user: ActiveUser, @Param('projectId') projectId: string) {
    return this.milestonesService.findAll(user.organizationId, projectId);
  }

  @Get('milestones/:id')
  async findOne(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    const milestone = await this.milestonesService.findOne(user.organizationId, id);
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    return milestone;
  }
}
