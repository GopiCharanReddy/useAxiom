import { Worker, Job, Queue } from 'bullmq';
import { getMockTasks } from '../utils/mock-db';

export function createIncomingMessagesWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[IncomingWorker] Starting incoming messages worker...');

  const worker = new Worker(
    'incoming_messages',
    async (job: Job) => {
      console.info(`[IncomingWorker] Processing job ${job.id} of type ${job.name}`);

      const payload = job.data.payload || job.data;
      let text = '';
      let waId = '';
      let name = '';

      if (payload?.object === 'whatsapp_business_account') {
        const value = payload.entry?.[0]?.changes?.[0]?.value;
        const contact = value?.contacts?.[0];
        const message = value?.messages?.[0];

        if (message) {
          text = message.text?.body || '';
          waId = message.from || '';
          name = contact?.profile?.name || 'Employee';
        }
      } else {
        text = payload.text || '';
        waId = payload.waId || payload.from || '';
        name = payload.name || 'Employee';
      }

      console.info(`[IncomingWorker] Received message from WaID: ${waId} (${name}): "${text}"`);

      // Intent classification
      let intent: 'COMPLETED' | 'BLOCKED' | 'DELAYED' | 'STARTING' | 'QUESTION' = 'QUESTION';
      const cleanText = text.toLowerCase().trim();

      if (
        cleanText.includes('done') ||
        cleanText.includes('finish') ||
        cleanText.includes('completed') ||
        cleanText.includes('complete')
      ) {
        intent = 'COMPLETED';
      } else if (
        cleanText.includes('stuck') ||
        cleanText.includes('block') ||
        cleanText.includes('cannot') ||
        cleanText.includes('cant')
      ) {
        intent = 'BLOCKED';
      } else if (
        cleanText.includes('delay') ||
        cleanText.includes('later') ||
        cleanText.includes('tomorrow') ||
        cleanText.includes('postpone')
      ) {
        intent = 'DELAYED';
      } else if (
        cleanText.includes('start') ||
        cleanText.includes('begin') ||
        cleanText.includes('ready')
      ) {
        intent = 'STARTING';
      }

      console.info(`[IncomingWorker] Classified intent: ${intent}`);

      // Locate task context
      const tasks = getMockTasks();
      const activeTask = tasks.find((t) => t.assigneePhone === waId && t.status !== 'COMPLETED');

      if (activeTask) {
        console.info(
          `[IncomingWorker] Active task found for employee: ${activeTask.title} (ID: ${activeTask.id})`,
        );

        if (intent === 'COMPLETED') {
          console.info(`[IncomingWorker] Task ${activeTask.id} marked as COMPLETED`);
          await outgoingQueue.add('send_message', {
            to: waId,
            content: `Great job, ${name}! I have marked your task "${activeTask.title}" as COMPLETED. Let me know when you are ready to start the next one.`,
            timestamp: new Date().toISOString(),
          });
        } else if (intent === 'BLOCKED') {
          console.info(`[IncomingWorker] Task ${activeTask.id} marked as BLOCKED`);
          await outgoingQueue.add('send_message', {
            to: waId,
            content: `I've marked your task "${activeTask.title}" as BLOCKED and notified your manager. We will get back to you shortly.`,
            timestamp: new Date().toISOString(),
          });

          // Alert manager
          const managerPhone = '+1122334455';
          await outgoingQueue.add('send_message', {
            to: managerPhone,
            content: `⚠️ Blocker Alert! Employee ${name} has reported a blocker on task "${activeTask.title}" (ID: ${activeTask.id}). Reason: "${text}". Please log into the dashboard or reply to resolve.`,
            timestamp: new Date().toISOString(),
          });
        } else if (intent === 'STARTING') {
          await outgoingQueue.add('send_message', {
            to: waId,
            content: `Got it! I've updated your status. Good luck starting "${activeTask.title}". Let me know if you run into any issues.`,
            timestamp: new Date().toISOString(),
          });
        } else if (intent === 'DELAYED') {
          await outgoingQueue.add('send_message', {
            to: waId,
            content: `No worries, ${name}. I've logged the delay for "${activeTask.title}". Make sure to keep us updated!`,
            timestamp: new Date().toISOString(),
          });
        } else {
          await outgoingQueue.add('send_message', {
            to: waId,
            content: `Hi ${name}, I couldn't quite determine if you were updating your task status. If you are finished, reply "Done". If you are stuck, reply "Blocked".`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.warn(`[IncomingWorker] No active task found for employee: ${waId}`);
        await outgoingQueue.add('send_message', {
          to: waId,
          content: `Hi ${name}! You don't have any active task assigned to you right now. I'll alert you as soon as a new task is approved.`,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, processedAt: new Date().toISOString(), intent };
    },
    {
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    console.info(`[IncomingWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[IncomingWorker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
