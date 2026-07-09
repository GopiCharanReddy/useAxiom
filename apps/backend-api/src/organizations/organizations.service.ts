import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Organization, User, Prisma, Role } from '@useaxiom/database';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  async inviteUser(
    organizationId: string,
    email: string,
    phoneNumber: string,
    role: Role,
    name: string,
  ): Promise<User> {
    // Check if organization exists
    const org = await this.findById(organizationId);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone number already exists');
    }

    return this.prisma.user.create({
      data: {
        email,
        phoneNumber,
        role,
        name,
        organization: {
          connect: { id: organizationId },
        },
      },
    });
  }
}
