import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Interpolate environment variables containing ${VAR} syntax
function interpolateEnv(val: string): string {
  const seen = new Set<string>();
  const resolve = (str: string): string => {
    return str.replace(/\${([^}]+)}/g, (_, name) => {
      if (seen.has(name)) return '';
      seen.add(name);
      const ref = process.env[name] || '';
      const resolved = resolve(ref);
      seen.delete(name);
      return resolved;
    });
  };
  return resolve(val);
}

for (const key in process.env) {
  const val = process.env[key];
  if (typeof val === 'string' && val.includes('${')) {
    process.env[key] = interpolateEnv(val);
  }
}

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
    await app.listen(8001);
  } catch (err: any) {
    console.error('BOOTSTRAP FAILED EXCEPTION:', err);
    process.exit(1);
  }
}
void bootstrap();
