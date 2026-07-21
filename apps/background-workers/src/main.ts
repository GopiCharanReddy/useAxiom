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
import { createNotificationsWorker } from './workers/notifications.worker';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

console.log(`Starting Background Workers with Redis URL: ${redisUrl}...`);

// 1. AI Leads Workers
// @ts-ignore
const plannerWorker = new Worker('planner_jobs', plannerWorkerProcessor, { connection: redisConnection as any });
// @ts-ignore
const whatsappWorker = new Worker('whatsapp_jobs', whatsappWorkerProcessor, { connection: redisConnection as any });

plannerWorker.on('completed', job => console.log(`[Planner] Job ${job.id} completed.`));
whatsappWorker.on('completed', job => console.log(`[WhatsApp] Job ${job.id} completed.`));

// 2. Communications, Outbound, & Notifications Queue Workers
const outgoingQueue = new Queue('outgoing_messages', { connection: redisConnection as any });
const inboundWorker = createIncomingMessagesWorker(redisConnection as any, outgoingQueue);
const outboundWorker = createOutgoingMessagesWorker(redisConnection as any);
const reminderWorker = createReminderSchedulerWorker(redisConnection as any, outgoingQueue);
const notificationsWorker = createNotificationsWorker(redisConnection as any, outgoingQueue);

// 3. Repeatable Cron Job Setup
const reminderSchedulerQueue = new Queue('reminder_scheduler', { connection: redisConnection as any });

async function setupRepeatableJobs() {
  console.info('[Background Workers] Setting up repeatable cron jobs...');
  try {
    const repeatableJobs = await reminderSchedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      console.info(`[Background Workers] Clearing old repeatable job: ${job.key}`);
      await reminderSchedulerQueue.removeRepeatableByKey(job.key);
    }

    await reminderSchedulerQueue.add('check_deadlines', {}, {
      repeat: {
        pattern: '*/1 * * * *', // Run every minute
      },
    });
    console.info('[Background Workers] Repeatable job check_deadlines scheduled successfully');
  } catch (error) {
    console.error('[Background Workers] Failed to setup repeatable jobs:', error);
  }
}

setupRepeatableJobs();

// 4. Queue Monitoring System
function monitorWorker(name: string, worker: Worker) {
  worker.on('failed', (job, err) => {
    console.error(`[QueueMonitor] Worker [${name}] job ${job?.id} failed:`, err.message || err);
  });
  worker.on('stalled', (jobId) => {
    console.warn(`[QueueMonitor] Worker [${name}] job ${jobId} stalled!`);
  });
  worker.on('error', (err) => {
    console.error(`[QueueMonitor] Worker [${name}] encountered error:`, err);
  });
}

monitorWorker('Planner', plannerWorker);
monitorWorker('WhatsAppAgent', whatsappWorker);
monitorWorker('InboundWebhook', inboundWorker);
monitorWorker('OutboundWhatsApp', outboundWorker);
monitorWorker('ReminderScheduler', reminderWorker);
monitorWorker('NotificationsEngine', notificationsWorker);

const monitoringQueues = [
  outgoingQueue,
  reminderSchedulerQueue,
  new Queue('incoming_messages', { connection: redisConnection as any }),
  new Queue('notifications', { connection: redisConnection as any }),
  new Queue('planner_jobs', { connection: redisConnection as any }),
  new Queue('whatsapp_jobs', { connection: redisConnection as any }),
];

const statsInterval = setInterval(async () => {
  console.info('[QueueMonitor] Periodic health check stats:');
  for (const queue of monitoringQueues) {
    try {
      const counts = await queue.getJobCounts();
      console.info(`  Queue [${queue.name}]: active=${counts.active}, waiting=${counts.waiting}, failed=${counts.failed}, delayed=${counts.delayed}, completed=${counts.completed}`);
    } catch (err) {
      console.error(`  Queue [${queue.name}] stats check failed:`, err);
    }
  }
}, 60000);
statsInterval.unref();

// SIGTERM hook to shut down cleanly
process.on('SIGTERM', async () => {
  console.info('Shutting down background workers...');
  clearInterval(statsInterval);
  try {
    await plannerWorker.close();
    await whatsappWorker.close();
    await inboundWorker.close();
    await outboundWorker.close();
    await reminderWorker.close();
    await notificationsWorker.close();
    await reminderSchedulerQueue.close();
    await outgoingQueue.close();
    for (const q of monitoringQueues) {
      await q.close();
    }
    await redisConnection.quit();
  } catch (err) {
    console.error('Error during workers shutdown:', err);
  }
  process.exit(0);
});
