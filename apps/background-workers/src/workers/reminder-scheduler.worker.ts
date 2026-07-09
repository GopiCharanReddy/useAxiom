import { Worker, Job, Queue } from 'bullmq';
import { getMockTasks } from '../utils/mock-db';

const remindedTasks = new Set<string>();

export function createReminderSchedulerWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[ReminderScheduler] Starting reminder scheduler worker...');

  const worker = new Worker(
    'reminder_scheduler',
    async (job: Job) => {
      if (job.name !== 'check_deadlines') {
        return { skipped: true };
      }

      console.info('[ReminderScheduler] Scanning tasks for deadline reminders...');
      const tasks = getMockTasks();
      const now = new Date();

      for (const task of tasks) {
        if (task.status === 'COMPLETED') {
          continue;
        }

        const timeDiffMs = task.deadline.getTime() - now.getTime();
        const hoursDiff = timeDiffMs / (60 * 60 * 1000);

        // 1. Overdue Tasks (Deadline in past)
        if (hoursDiff < 0) {
          const trackerKey = `${task.id}:overdue`;
          if (!remindedTasks.has(trackerKey)) {
            console.info(
              `[ReminderScheduler] Task ${task.id} is OVERDUE. Enqueuing alert to ${task.assigneePhone}.`,
            );

            await outgoingQueue.add('send_message', {
              to: task.assigneePhone,
              content: `⚠️ Overdue Alert: Your task "${task.title}" (ID: ${task.id}) is past its deadline. Please reply "Done" to mark it complete, or text us what is blocking you.`,
              timestamp: new Date().toISOString(),
            });

            remindedTasks.add(trackerKey);
          }
        }
        // 2. Approaching Tasks (Deadline within 2 hours)
        else if (hoursDiff <= 2.0) {
          const trackerKey = `${task.id}:approaching`;
          if (!remindedTasks.has(trackerKey)) {
            console.info(
              `[ReminderScheduler] Task ${task.id} is approaching deadline. Enqueuing reminder to ${task.assigneePhone}.`,
            );

            await outgoingQueue.add('send_message', {
              to: task.assigneePhone,
              content: `⏰ Reminder: Your task "${task.title}" (ID: ${task.id}) is approaching its deadline. You have ${hoursDiff.toFixed(1)} hour(s) remaining. Reply "Done" when finished!`,
              timestamp: new Date().toISOString(),
            });

            remindedTasks.add(trackerKey);
          }
        }
      }

      return { success: true, processedAt: new Date().toISOString() };
    },
    {
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    console.info(`[ReminderScheduler] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ReminderScheduler] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
