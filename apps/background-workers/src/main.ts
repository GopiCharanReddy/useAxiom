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
import { createAssignmentWorker } from './workers/ai-assignment.worker';
import { createReportingWorker } from './workers/ai-reporting.worker';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

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

// 2. Communications, Outbound, & Notifications Queue Workers
const outgoingQueue = new Queue('outgoing_messages', { connection: redisConnection as any });
const inboundWorker = createIncomingMessagesWorker(redisConnection as any, outgoingQueue);
const outboundWorker = createOutgoingMessagesWorker(redisConnection as any);
const reminderWorker = createReminderSchedulerWorker(redisConnection as any, outgoingQueue);
const notificationsWorker = createNotificationsWorker(redisConnection as any, outgoingQueue);
const assignmentWorker = createAssignmentWorker(redisConnection as any, outgoingQueue);
const notificationsQueue = new Queue('notifications', { connection: redisConnection as any });
const reportingWorker = createReportingWorker(redisConnection as any, notificationsQueue);

// 3. Repeatable Cron Job Setup
const reminderSchedulerQueue = new Queue('reminder_scheduler', {
  connection: redisConnection as any,
});
const reportingSchedulerQueue = new Queue('reporting_jobs', { connection: redisConnection as any });

async function setupRepeatableJobs() {
  console.info('[Background Workers] Setting up repeatable cron jobs...');
  try {
    const repeatableJobs = await reminderSchedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      console.info(`[Background Workers] Clearing old repeatable job: ${job.key}`);
      await reminderSchedulerQueue.removeRepeatableByKey(job.key);
    }

    const checkDeadlinesPattern = process.env.CRON_CHECK_DEADLINES || '0 * * * *';
    await reminderSchedulerQueue.add(
      'check_deadlines',
      {},
      {
        repeat: {
          pattern: checkDeadlinesPattern,
        },
      },
    );
    console.info(
      `[Background Workers] Repeatable job check_deadlines scheduled successfully with pattern: ${checkDeadlinesPattern}`,
    );

    const reportingJobs = await reportingSchedulerQueue.getRepeatableJobs();
    for (const job of reportingJobs) {
      await reportingSchedulerQueue.removeRepeatableByKey(job.key);
    }
    const checkHealthPattern = process.env.CRON_CHECK_HEALTH || '0 * * * *';
    await reportingSchedulerQueue.add(
      'check_health',
      {},
      {
        repeat: {
          pattern: checkHealthPattern,
        },
      },
    );
    console.info(
      `[Background Workers] Repeatable job check_health scheduled successfully with pattern: ${checkHealthPattern}`,
    );
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
      console.info(
        `  Queue [${queue.name}]: active=${counts.active}, waiting=${counts.waiting}, failed=${counts.failed}, delayed=${counts.delayed}, completed=${counts.completed}`,
      );
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
    await assignmentWorker.close();
    await reportingWorker.close();
    await reminderSchedulerQueue.close();
    await reportingSchedulerQueue.close();
    await outgoingQueue.close();
    await notificationsQueue.close();
    for (const q of monitoringQueues) {
      await q.close();
    }
    await redisConnection.quit();
  } catch (err) {
    console.error('Error during workers shutdown:', err);
  }
  process.exit(0);
});
