import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@useaxiom/database';
import { ReminderRulesService } from '../services/reminder-rules.service';
import { CreateReminderRuleDto } from '../dto/create-reminder-rule.dto';

interface ActiveUser {
  id: string;
  organizationId: string;
  role: Role;
}

@Controller('communication/reminder-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class ReminderRulesController {
  constructor(private readonly reminderRulesService: ReminderRulesService) {}

  @Get()
  async findAll(@CurrentUser() user: ActiveUser) {
    return this.reminderRulesService.findAll(user.organizationId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: ActiveUser, @Body() dto: CreateReminderRuleDto) {
    return this.reminderRulesService.create(user.organizationId, dto);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.reminderRulesService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: ActiveUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateReminderRuleDto>,
  ) {
    return this.reminderRulesService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    await this.reminderRulesService.softDelete(user.organizationId, id);
  }

  @Post(':id/activate')
  async activate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.reminderRulesService.setActive(user.organizationId, id, true);
  }

  @Post(':id/deactivate')
  async deactivate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.reminderRulesService.setActive(user.organizationId, id, false);
  }
}
