import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CustomRequest extends Request {
  tenantId?: string;
}

interface PrismaErrorMeta {
  target?: string[];
  cause?: string;
  field_name?: string;
}

interface PrismaError {
  code: string;
  message: string;
  meta?: PrismaErrorMeta;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CustomRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if ('message' in resObj) {
          if (Array.isArray(resObj.message)) {
            message = resObj.message.map((m) => String(m));
          } else {
            message = String(resObj.message);
          }
        } else {
          message = JSON.stringify(res);
        }
      } else {
        message = String(res);
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      // Handle Prisma Errors
      const prismaError = exception as PrismaError;
      switch (prismaError.code) {
        case 'P2002': // Unique constraint failed
          status = HttpStatus.CONFLICT;
          message = `Unique constraint failed on field(s): ${prismaError.meta?.target?.join(', ') || 'unknown'}`;
          break;
        case 'P2025': // Record to update not found
          status = HttpStatus.NOT_FOUND;
          message = prismaError.meta?.cause || 'Record not found';
          break;
        case 'P2003': // Foreign key constraint failed
          status = HttpStatus.BAD_REQUEST;
          message = `Foreign key constraint failed on field: ${prismaError.meta?.field_name || 'unknown'}`;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = prismaError.message || 'Database error occurred';
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const tenantId = request.tenantId || 'anonymous';
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      tenantId,
      message,
    };

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Tenant: ${tenantId} - Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
