import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptUtility } from '../common/utils/bcrypt.utility';
import { User } from '@useaxiom/database';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
}
