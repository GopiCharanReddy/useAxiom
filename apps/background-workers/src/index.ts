import { formatDateString } from '@useaxiom/utils';

function bootstrap() {
  console.info(`[${formatDateString(new Date())}] Background workers service skeleton started.`);
}

bootstrap();
