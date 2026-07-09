import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { plannerWorkerProcessor } from './workers/ai-planner.worker';
import { whatsappWorkerProcessor } from './workers/whatsapp.worker';
import { createIncomingMessagesWorker } from './workers/incoming-messages.worker';
import { createOutgoingMessagesWorker } from './workers/outgoing-messages.worker';
import { createReminderSchedulerWorker } from './workers/reminder-scheduler.worker';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new IORedis(redisUrl);

console.log(`Starting Background Workers with Redis URL: ${redisUrl}...`);

// 1. AI Leads Workers
// @ts-ignore
const plannerWorker = new Worker('planner_jobs', plannerWorkerProcessor, {
  connection: redisConnection as any,
});
// @ts-ignore
const whatsappWorker = new Worker('whatsapp_jobs', whatsappWorkerProcessor, {
  connection: redisConnection as any,
});

plannerWorker.on('completed', (job) => console.log(`[Planner] Job ${job.id} completed.`));
whatsappWorker.on('completed', (job) => console.log(`[WhatsApp] Job ${job.id} completed.`));

// 2. Communications & Outbound Queue Workers
const outgoingQueue = new Queue('outgoing_messages', { connection: redisConnection as any });
const inboundWorker = createIncomingMessagesWorker(redisConnection as any, outgoingQueue);
const outboundWorker = createOutgoingMessagesWorker(redisConnection as any);
const reminderWorker = createReminderSchedulerWorker(redisConnection as any, outgoingQueue);

// 3. Repeatable Cron Job Setup
const reminderSchedulerQueue = new Queue('reminder_scheduler', {
  connection: redisConnection as any,
});

async function setupRepeatableJobs() {
  console.info('[Background Workers] Setting up repeatable cron jobs...');
  try {
    const repeatableJobs = await reminderSchedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      console.info(`[Background Workers] Clearing old repeatable job: ${job.key}`);
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

// SIGTERM hook to shut down cleanly
process.on('SIGTERM', async () => {
  console.info('Shutting down background workers...');
  try {
    await plannerWorker.close();
    await whatsappWorker.close();
    await inboundWorker.close();
    await outboundWorker.close();
    await reminderWorker.close();
    await reminderSchedulerQueue.close();
    await outgoingQueue.close();
    await redisConnection.quit();
  } catch (err) {
    console.error('Error during workers shutdown:', err);
  }
  process.exit(0);
});
