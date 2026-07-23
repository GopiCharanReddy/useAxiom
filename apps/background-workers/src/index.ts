import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { Queue } from 'bullmq';
import { createIncomingMessagesWorker } from './workers/incoming-messages.worker';
import { createOutgoingMessagesWorker } from './workers/outgoing-messages.worker';
import { createReminderSchedulerWorker } from './workers/reminder-scheduler.worker';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisConnection = { host: redisHost, port: redisPort };

console.info(`[Background Workers] Initializing with Redis connection: ${redisHost}:${redisPort}`);

const outgoingQueue = new Queue('outgoing_messages', { connection: redisConnection });

const inboundWorker = createIncomingMessagesWorker(redisConnection, outgoingQueue);
const outboundWorker = createOutgoingMessagesWorker(redisConnection);

// Setup reminder scheduler queue and repeatable job
const reminderSchedulerQueue = new Queue('reminder_scheduler', { connection: redisConnection });

const reminderWorker = createReminderSchedulerWorker(redisConnection, outgoingQueue);

async function setupRepeatableJobs() {
  console.info('[Background Workers] Setting up repeatable cron jobs...');
  try {
    const repeatableJobs = await reminderSchedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      console.info(`[Background Workers] Clearing old repeatable job: ${job.name}`);
      await reminderSchedulerQueue.removeRepeatableByKey(job.key);
    }

    await reminderSchedulerQueue.add(
      'check_deadlines',
      {},
      {
        repeat: {
          pattern: '*/1 * * * *', // Run every minute
        },
      },
    );
    console.info('[Background Workers] Repeatable job check_deadlines scheduled successfully');
  } catch (error) {
    console.error('[Background Workers] Failed to setup repeatable jobs:', error);
  }
}

setupRepeatableJobs();

process.on('SIGTERM', async () => {
  console.info('[Background Workers] Shutting down workers...');
  await inboundWorker.close();
  await outboundWorker.close();
  await reminderWorker.close();
  await reminderSchedulerQueue.close();
  await outgoingQueue.close();
  process.exit(0);
});
