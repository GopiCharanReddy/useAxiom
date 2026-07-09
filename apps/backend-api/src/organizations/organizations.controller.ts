import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Role } from '@useaxiom/database';
import { IsEmail, IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(':id/invite-user')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(@Param('id') organizationId: string, @Body() body: InviteUserDto) {
    return this.organizationsService.inviteUser(
      organizationId,
      body.email,
      body.phoneNumber,
      body.role,
      body.name,
    );
  }
}
