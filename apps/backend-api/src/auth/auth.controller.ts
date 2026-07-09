import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from '@useaxiom/database';

interface AuthenticatedRequest {
  user: Omit<User, 'passwordHash'>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }
}
