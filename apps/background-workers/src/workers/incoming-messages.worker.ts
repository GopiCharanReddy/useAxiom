import { Worker, Job, Queue } from 'bullmq';
import { prisma } from '@useaxiom/database';
import { AiOrchestrator } from '@useaxiom/ai-core';
import { getLlmProvider } from '@useaxiom/ai-providers';
import { RagMemory } from '@useaxiom/ai-memory';

export function createIncomingMessagesWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[IncomingWorker] Starting incoming messages worker...');

  const provider = getLlmProvider();
  const memory = new RagMemory(provider);
  const orchestrator = new AiOrchestrator({ provider, memory });

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

      // Locate task context via Prisma
      const assignment = await prisma.assignment.findFirst({
        where: {
          user: {
            phoneNumber: waId,
          },
          task: {
            status: {
              in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'],
            },
          },
        },
        include: {
          task: true,
          user: true,
        },
      });

      if (!assignment) {
        console.warn(`[IncomingWorker] No active task found for employee: ${waId}`);
        await outgoingQueue.add('send_message', {
          to: waId,
          content: `Hi ${name}! You don't have any active task assigned to you right now. I'll alert you as soon as a new task is approved.`,
          timestamp: new Date().toISOString(),
        });
        return { success: true, processedAt: new Date().toISOString(), intent: 'OTHER' };
      }

      const activeTask = assignment.task;
      const employeeName = assignment.user.name;
      console.info(
        `[IncomingWorker] Active task found for employee: ${activeTask.title} (ID: ${activeTask.id})`,
      );

      // Inject some task context into the AI's understanding so it can respond appropriately
      const contextualMessage = `Context - Employee Name: ${employeeName}. Active Task: ${activeTask.title}. Task Description: ${activeTask.description}\n\nEmployee Message: ${text}`;

      console.info(`[IncomingWorker] Invoking ConversationAgent for WaID: ${waId}`);
      const aiResponse = await orchestrator.getConversation().run({
        threadId: waId,
        message: contextualMessage,
      });

      console.info(`[IncomingWorker] AI classified intent: ${aiResponse.intent}`);

      if (aiResponse.intent === 'COMPLETED') {
        console.info(`[IncomingWorker] Task ${activeTask.id} marked as COMPLETED`);
        await prisma.task.update({ where: { id: activeTask.id }, data: { status: 'COMPLETED' } });
      } else if (aiResponse.intent === 'BLOCKED') {
        console.info(`[IncomingWorker] Task ${activeTask.id} marked as BLOCKED`);

        const blockReason = aiResponse.extractedParameters?.blockReason || text;
        console.info(`[IncomingWorker] Blocker Reason: ${blockReason}`);

        await prisma.task.update({
          where: { id: activeTask.id },
          data: { status: 'BLOCKED' },
        });

        // Alert manager
        const managerPhone = '+1122334455';
        await outgoingQueue.add('send_message', {
          to: managerPhone,
          content: `⚠️ Blocker Alert! Employee ${name} has reported a blocker on task "${activeTask.title}" (ID: ${activeTask.id}). Reason: "${blockReason}". Please log into the dashboard or reply to resolve.`,
          timestamp: new Date().toISOString(),
        });
      }

      // Send the AI generated reply
      await outgoingQueue.add('send_message', {
        to: waId,
        content: aiResponse.reply,
        timestamp: new Date().toISOString(),
      });

      return { success: true, processedAt: new Date().toISOString(), intent: aiResponse.intent };
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
