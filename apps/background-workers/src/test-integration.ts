import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisConnection = { host: redisHost, port: redisPort };

async function runSimulation() {
  console.info('\n==================================================');
  console.info('STARTING END-TO-END COMMUNICATIONS INTEGRATION TEST');
  console.info('==================================================\n');
  console.info(`Connecting to Redis at ${redisHost}:${redisPort}...`);

  const inboundQueue = new Queue('incoming_messages', { connection: redisConnection });
  const schedulerQueue = new Queue('reminder_scheduler', { connection: redisConnection });
  const outboundQueue = new Queue('outgoing_messages', { connection: redisConnection });
  const notificationsQueue = new Queue('notifications', { connection: redisConnection });

  // 1. Simulate summary trigger enqueuing (Outbound summary)
  console.info('\n--- Test Scenario 1: Manual Daily Summary Trigger ---');
  console.info('Enqueuing daily summary dispatch for Sarah (+0987654321)...');
  await outboundQueue.add('send_message', {
    to: '+0987654321',
    content: 'Hello Sarah, here is your daily task summary for today in useAxiom. Make sure to update your task status via WhatsApp!',
  });

  // 2. Simulate webhook: David reporting a blocker
  console.info('\n--- Test Scenario 2: Webhook - Blocker Reported ---');
  console.info('Simulating webhook payload for David (+1234567890) saying: "I am stuck on google drive link"...');
  await inboundQueue.add('process_webhook', {
    waId: '+1234567890',
    name: 'David',
    text: 'I am stuck on google drive link',
  });

  // 3. Simulate webhook: Sarah reporting completion
  console.info('\n--- Test Scenario 3: Webhook - Task Completion ---');
  console.info('Simulating webhook payload for Sarah (+0987654321) saying: "Just finished target audience task"...');
  await inboundQueue.add('process_webhook', {
    waId: '+0987654321',
    name: 'Sarah',
    text: 'Just finished target audience task',
  });

  // 4. Simulate cron deadline scan check
  console.info('\n--- Test Scenario 4: Cron repeatable check_deadlines trigger ---');
  console.info('Enqueuing check_deadlines task scheduler scanner job...');
  await schedulerQueue.add('check_deadlines', {});

  // 5. Simulate notifications queue enqueuing
  console.info('\n--- Test Scenario 5: Multi-Channel Template Notification ---');
  console.info('Enqueuing TASK_ASSIGNED template alert to notifications queue...');
  await notificationsQueue.add('send-notification', {
    recipient: {
      phone: '+1234567890',
      email: 'employee@example.com',
      name: 'John Doe',
    },
    channels: ['WHATSAPP', 'EMAIL', 'SMS', 'IN_APP'],
    template: 'TASK_ASSIGNED',
    variables: {
      taskId: 'task-abc-123',
      taskTitle: 'Design System Documentation',
      dueDate: '2026-07-15',
    },
  });

  // Wait a few seconds for workers to log the process
  console.info('\nWaiting 5 seconds for background workers fleet to complete processing...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Close queues
  await inboundQueue.close();
  await schedulerQueue.close();
  await outboundQueue.close();
  await notificationsQueue.close();

  console.info('\n==================================================');
  console.info('INTEGRATION TEST SIMULATION COMPLETED');
  console.info('==================================================\n');
}

runSimulation().catch(console.error);
