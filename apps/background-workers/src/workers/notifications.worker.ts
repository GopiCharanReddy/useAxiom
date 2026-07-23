import { Worker, Job, Queue } from 'bullmq';

const TEMPLATES: Record<string, Record<string, { subject?: string; body: string }>> = {
  DAILY_SUMMARY: {
    EMAIL: {
      subject: 'useAxiom Daily Task Summary',
      body: `<h3>Hello {{employeeName}},</h3>
<p>Here is your daily task summary for today in useAxiom. Make sure to update your task status via WhatsApp!</p>
<p>Check the dashboard for details on your current workload and due dates.</p>`,
    },
    WHATSAPP: {
      body: `Hello {{employeeName}}, here is your daily task summary for today in useAxiom. Make sure to update your task status via WhatsApp!`,
    },
  },
  BLOCKER_ALERT: {
    EMAIL: {
      subject: '⚠️ Blocker Alert: Action Required',
      body: `<h3>⚠️ Blocker Alert!</h3>
<p>Employee <strong>{{employeeName}}</strong> has reported a blocker on task ID: <strong>{{taskId}}</strong>.</p>
<p><strong>Reason:</strong> "{{reason}}"</p>
<p>Please log into the dashboard or reply via WhatsApp to resolve this blocker.</p>`,
    },
    WHATSAPP: {
      body: `⚠️ Blocker Alert! Employee {{employeeName}} has reported a blocker on task ID: {{taskId}}. Reason: "{{reason}}". Please log into the dashboard or reply to resolve.`,
    },
  },
  DEADLINE_REMINDER: {
    EMAIL: {
      subject: '⏰ Deadline Reminder: {{taskTitle}}',
      body: `<h3>⏰ Deadline Reminder</h3>
<p>Your task "<strong>{{taskTitle}}</strong>" is approaching its deadline.</p>
<p>You have <strong>{{hoursRemaining}}</strong> hour(s) remaining.</p>`,
    },
    WHATSAPP: {
      body: `⏰ Reminder: Your task "{{taskTitle}}" is approaching its deadline. You have {{hoursRemaining}} hour(s) remaining. Reply "Done" when completed or text us if you are blocked.`,
    },
    SMS: {
      body: `⏰ Reminder: Your task "{{taskTitle}}" is due in {{hoursRemaining}} hours.`,
    },
  },
  TASK_ASSIGNED: {
    EMAIL: {
      subject: '📋 New Task Assigned: {{taskTitle}}',
      body: `<h3>📋 New Task Assigned</h3>
<p>You have been assigned the task "<strong>{{taskTitle}}</strong>" (ID: {{taskId}}).</p>
<p><strong>Due Date:</strong> {{dueDate}}</p>
<p>Please confirm or start work via your employee portal or WhatsApp.</p>`,
    },
    WHATSAPP: {
      body: `📋 New Task Assigned: You have been assigned "{{taskTitle}}" (ID: {{taskId}}), due on {{dueDate}}. Reply to confirm or get started.`,
    },
    SMS: {
      body: `📋 New Task Assigned: "{{taskTitle}}" is due on {{dueDate}}.`,
    },
    IN_APP: {
      body: `📋 New Task Assigned: You have been assigned "{{taskTitle}}", due on {{dueDate}}.`,
    },
  },
  PROJECT_RISK_ALERT: {
    EMAIL: {
      subject: '⚠️ Project Risk Alert: {{projectName}}',
      body: `<h3>⚠️ Project Risk Alert</h3>
<p>Project <strong>{{projectName}}</strong> has been flagged with a high risk score of <strong>{{riskScore}}</strong>.</p>
<p><strong>Reasoning:</strong> "{{reasoning}}"</p>
<p>Please review the dashboard for detailed suggestions.</p>`,
    },
    WHATSAPP: {
      body: `⚠️ Project Risk Alert: Project {{projectName}} has been flagged with a high risk score of {{riskScore}}. Reasoning: "{{reasoning}}".`,
    },
  },
};

function compileTemplate(templateStr: string, variables: Record<string, any>): string {
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`{{${key}}}`).join(String(value));
  }
  return result;
}

export function createNotificationsWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[NotificationsWorker] Starting notifications worker...');

  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      console.info(`[NotificationsWorker] Processing job ${job.id} of type ${job.name}`);

      const { recipient, channels, template, variables } = job.data;
      if (!channels || !Array.isArray(channels)) {
        console.warn(`[NotificationsWorker] Invalid channels in job ${job.id}:`, channels);
        return { success: false, reason: 'Invalid channels configuration' };
      }

      const results: Record<string, any> = {};

      for (const channel of channels) {
        const channelConfig = TEMPLATES[template]?.[channel];
        if (!channelConfig) {
          console.warn(
            `[NotificationsWorker] No template config found for ${template} on channel ${channel}`,
          );
          continue;
        }

        const renderedBody = compileTemplate(channelConfig.body, variables || {});
        const renderedSubject = channelConfig.subject
          ? compileTemplate(channelConfig.subject, variables || {})
          : undefined;

        console.info(
          `[NotificationsWorker] Dispatching ${template} via ${channel} to ${recipient?.name || 'recipient'}`,
        );

        switch (channel) {
          case 'WHATSAPP':
            if (!recipient?.phone) {
              console.warn('[NotificationsWorker] Missing phone number for WHATSAPP notification');
              results.WHATSAPP = { success: false, reason: 'Missing phone number' };
              break;
            }
            // Enqueue to outgoing_messages queue for Meta Business API processing
            const whatsappJob = await outgoingQueue.add(
              'send_message',
              {
                to: recipient.phone,
                content: renderedBody,
                timestamp: new Date().toISOString(),
              },
              {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              },
            );
            results.WHATSAPP = { success: true, jobId: whatsappJob.id };
            break;

          case 'EMAIL':
            if (!recipient?.email) {
              console.warn('[NotificationsWorker] Missing email address for EMAIL notification');
              results.EMAIL = { success: false, reason: 'Missing email' };
              break;
            }
            // Simulated email dispatch
            console.info(`[NotificationsWorker] (SIMULATED EMAIL) To: ${recipient.email}`);
            console.info(`[NotificationsWorker] (SIMULATED EMAIL) Subject: ${renderedSubject}`);
            console.info(`[NotificationsWorker] (SIMULATED EMAIL) Body:\n${renderedBody}`);
            results.EMAIL = { success: true, simulated: true };
            break;

          case 'SMS':
            if (!recipient?.phone) {
              console.warn('[NotificationsWorker] Missing phone number for SMS notification');
              results.SMS = { success: false, reason: 'Missing phone number' };
              break;
            }
            // Simulated SMS dispatch
            console.info(`[NotificationsWorker] (SIMULATED SMS) To: ${recipient.phone}`);
            console.info(`[NotificationsWorker] (SIMULATED SMS) Body: ${renderedBody}`);
            results.SMS = { success: true, simulated: true };
            break;

          case 'IN_APP':
            // Simulated database insert for in-app notifications
            console.info(
              `[NotificationsWorker] (SIMULATED IN-APP) User: ${recipient?.name || 'Unknown'}`,
            );
            console.info(`[NotificationsWorker] (SIMULATED IN-APP) Content: ${renderedBody}`);
            results.IN_APP = { success: true, simulated: true };
            break;

          default:
            console.warn(`[NotificationsWorker] Unsupported channel type: ${channel}`);
        }
      }

      return { success: true, results, processedAt: new Date().toISOString() };
    },
    {
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    console.info(`[NotificationsWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[NotificationsWorker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
