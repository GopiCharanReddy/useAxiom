import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@useaxiom/database';

interface ActiveUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

interface CreateEmployeeDto {
  name: string;
  phoneNumber: string;
  email?: string;
  role?: string;
  experience?: string;
  specialty?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentUser() user: ActiveUser) {
    return this.usersService.findAllByOrg(user.organizationId);
  }

  @Post('employee')
  async createEmployee(@CurrentUser() user: ActiveUser, @Body() dto: CreateEmployeeDto) {
    return this.usersService.createEmployee(user.organizationId, dto);
  }

  @Post('bulk-employees')
  async createBulkEmployees(
    @CurrentUser() user: ActiveUser,
    @Body() body: { employees: CreateEmployeeDto[] },
  ) {
    const list = body.employees || [];
    return this.usersService.createBulkEmployees(user.organizationId, list);
  }

  @Patch(':id/phone')
  async updatePhone(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
    return this.usersService.update(id, { phoneNumber });
  }
}

