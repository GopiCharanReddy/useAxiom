import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import * as path from 'path';

const env = dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenvExpand(env);
dotenv.config();

import { AppModule } from './app.module';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { abortOnError: false, rawBody: true });
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    const port = process.env.BACKEND_PORT || 3001;
    await app.listen(port);
  } catch (err: any) {
    console.error('BOOTSTRAP FAILED EXCEPTION:', err);
    process.exit(1);
  }
}
void bootstrap();
