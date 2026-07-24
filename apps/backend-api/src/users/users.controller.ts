import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentUser() user: ActiveUser) {
    return this.usersService.findAllByOrg(user.organizationId);
  }

  @Patch(':id/phone')
  async updatePhone(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
    return this.usersService.update(id, { phoneNumber });
  }
}
