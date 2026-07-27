import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, Role } from '@useaxiom/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByIdWithOrg(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        organization: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async createEmployee(
    organizationId: string,
    data: {
      name: string;
      phoneNumber: string;
      email?: string;
      role?: string;
      experience?: string;
      specialty?: string;
    },
  ): Promise<User> {
    const count = await this.prisma.user.count({ where: { organizationId } });
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    const fullSpecialty = data.experience
      ? `${data.role || data.specialty || 'Employee'} (${data.experience} exp)`
      : data.role || data.specialty || 'Employee';

    const cleanEmail =
      data.email && data.email.trim() !== '' ? data.email.trim().toLowerCase() : null;

    return this.prisma.user.create({
      data: {
        organizationId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: cleanEmail,
        role: Role.EMPLOYEE,
        employeeId,
        specialty: fullSpecialty,
      },
    });
  }

  async createBulkEmployees(
    organizationId: string,
    employeesData: Array<{
      name: string;
      phoneNumber: string;
      email?: string;
      role?: string;
      experience?: string;
      specialty?: string;
    }>,
  ): Promise<User[]> {
    const createdUsers: User[] = [];
    for (const emp of employeesData) {
      if (emp.name && emp.phoneNumber) {
        const user = await this.createEmployee(organizationId, emp);
        createdUsers.push(user);
      }
    }
    return createdUsers;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAllByOrg(organizationId: string): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        projectMembers: {
          where: {
            project: {
              deletedAt: null,
            },
          },
          include: {
            project: {
              include: {
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

