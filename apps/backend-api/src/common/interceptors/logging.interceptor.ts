import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface CustomRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<CustomRequest>();
    const res = ctx.getResponse<Response>();

    const method = req.method;
    const url = req.url;
    const tenantId = req.tenantId || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${method}] ${url} - Status: ${statusCode} - Tenant: ${tenantId} - Duration: ${duration}ms`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = err instanceof HttpException ? err.getStatus() : 500;
          this.logger.warn(
            `[${method}] ${url} - Status: ${statusCode} - Tenant: ${tenantId} - Duration: ${duration}ms (Failed)`,
          );
        },
      }),
    );
  }
}
