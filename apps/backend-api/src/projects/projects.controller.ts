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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/project.dto';
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

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: ActiveUser, @Body() body: CreateProjectDto) {
    return this.projectsService.create(user.organizationId, user.id, body);
  }

  @Get()
  async findAll(@CurrentUser() user: ActiveUser) {
    return this.projectsService.findAll(user.organizationId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    const project = await this.prismaFindOneHelper(user.organizationId, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  private async prismaFindOneHelper(organizationId: string, id: string) {
    return this.projectsService.findOne(organizationId, id);
  }
}
