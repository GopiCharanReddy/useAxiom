import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Tenant context is missing');
    }

    // Validate that if the user is explicitly requesting a specific org's data, it matches their own
    const targetOrgId = request.params.orgId || request.body.organizationId;

    if (targetOrgId && targetOrgId !== user.organizationId) {
      throw new ForbiddenException('Cross-tenant data access is strictly forbidden');
    }

    return true;
  }
}
