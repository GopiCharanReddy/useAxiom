import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptUtility } from '../common/utils/bcrypt.utility';
import { User, Role } from '@useaxiom/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await BcryptUtility.compare(pass, user.passwordHash);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findByIdWithOrg(userId);
    if (!user) return null;
    const { passwordHash, ...result } = user;
    return result;
  }

  login(user: Omit<User, 'passwordHash'>) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        role: user.role,
        organization_id: user.organizationId,
      },
    };
  }

  async register(
    organizationName: string,
    name: string,
    email: string,
    passwordPlain: string,
    phoneNumber: string,
    role: Role = Role.MANAGER,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone number already exists');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: organizationName,
      },
    });

    const passwordHash = await BcryptUtility.hash(passwordPlain);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phoneNumber,
        role,
        organization: {
          connect: { id: org.id },
        },
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organizationId,
      },
    };
  }
}
