import { Worker, Job, Queue } from 'bullmq';
import { getMockTasks } from '../utils/mock-db';
import { generateAiReminderMessage } from '@useaxiom/ai-providers';

const remindedTasks = new Set<string>();

export function createReminderSchedulerWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[ReminderScheduler] Starting automatic AI reminder scheduler worker...');

  const worker = new Worker(
    'reminder_scheduler',
    async (job: Job) => {
      if (job.name !== 'check_deadlines') {
        return { skipped: true };
      }

      console.info('[ReminderScheduler] Scanning active projects for daily AI reminders...');
      const tasks = getMockTasks();
      const now = new Date();

      for (const task of tasks) {
        if (task.status === 'COMPLETED') {
          continue;
        }

        const timeDiffMs = task.deadline.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiffMs / (24 * 60 * 60 * 1000));
        const hoursDiff = timeDiffMs / (60 * 60 * 1000);

        // 1. Overdue Tasks (Deadline in past)
        if (hoursDiff < 0) {
          const trackerKey = `${task.id}:overdue`;
          if (!remindedTasks.has(trackerKey)) {
            const aiMessage = generateAiReminderMessage({
              employeeName: task.assigneeName || 'Team Member',
              projectName: task.title,
              deadline: task.deadline.toLocaleDateString(),
              daysRemaining,
              aiTone: 'Strict',
            });

            console.info(
              `[ReminderScheduler] Project ${task.id} is OVERDUE. Enqueuing AI reminder to ${task.assigneePhone}.`,
            );

            await outgoingQueue.add('send_message', {
              to: task.assigneePhone,
              content: aiMessage,
              timestamp: new Date().toISOString(),
            });

            remindedTasks.add(trackerKey);
          }
        }
        // 2. Approaching Tasks (Daily or Deadline approaching)
        else if (hoursDiff <= 48.0) {
          const trackerKey = `${task.id}:approaching_${daysRemaining}`;
          if (!remindedTasks.has(trackerKey)) {
            const aiMessage = generateAiReminderMessage({
              employeeName: task.assigneeName || 'Team Member',
              projectName: task.title,
              deadline: task.deadline.toLocaleDateString(),
              daysRemaining,
              aiTone: 'Professional',
            });

            console.info(
              `[ReminderScheduler] Enqueuing daily AI WhatsApp reminder for ${task.title} to ${task.assigneePhone}.`,
            );

            await outgoingQueue.add('send_message', {
              to: task.assigneePhone,
              content: aiMessage,
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
