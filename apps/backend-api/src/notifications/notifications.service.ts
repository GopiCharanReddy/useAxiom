import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private notificationsQueue: Queue) {}

  async sendTestNotification(userId: string, message: string) {
    const job = await this.notificationsQueue.add(
      'test-notification',
      {
        userId,
        message,
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return {
      success: true,
      jobId: job.id,
      message: 'Notification job queued successfully',
    };
  }

  async triggerOrganizationSummary(orgId: string): Promise<void> {
    console.info(`[NotificationsService] Triggering summary broadcast for org: ${orgId}`);

    const mockEmployees = [
      { name: 'David', phone: '+1234567890', email: 'david@example.com' },
      { name: 'Sarah', phone: '+0987654321', email: 'sarah@example.com' },
    ];

    for (const employee of mockEmployees) {
      await this.notificationsQueue.add(
        'send-notification',
        {
          recipient: {
            phone: employee.phone,
            email: employee.email,
            name: employee.name,
          },
          channels: ['WHATSAPP', 'EMAIL'],
          template: 'DAILY_SUMMARY',
          variables: {
            employeeName: employee.name,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    }
  }

  async sendBlockerAlert(
    taskId: string,
    managerPhone: string,
    employeeName: string,
    reason: string,
  ): Promise<void> {
    console.info(
      `[NotificationsService] Triggering blocker alert for task ${taskId} to manager ${managerPhone}`,
    );

    await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone: managerPhone,
          name: 'Manager',
        },
        channels: ['WHATSAPP', 'EMAIL'],
        template: 'BLOCKER_ALERT',
        variables: {
          taskId,
          employeeName,
          reason,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendDeadlineReminder(
    taskId: string,
    employeePhone: string,
    taskTitle: string,
    hoursRemaining: number,
  ): Promise<void> {
    console.info(
      `[NotificationsService] Triggering deadline reminder for task ${taskId} to employee ${employeePhone}`,
    );

    await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone: employeePhone,
        },
        channels: ['WHATSAPP', 'EMAIL', 'SMS'],
        template: 'DEADLINE_REMINDER',
        variables: {
          taskTitle,
          hoursRemaining,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendTaskAssignedAlert(
    taskId: string,
    employeePhone: string,
    taskTitle: string,
    dueDate: string,
  ): Promise<void> {
    console.info(
      `[NotificationsService] Triggering task assignment alert for task ${taskId} to employee ${employeePhone}`,
    );

    await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone: employeePhone,
        },
        channels: ['WHATSAPP', 'EMAIL', 'SMS', 'IN_APP'],
        template: 'TASK_ASSIGNED',
        variables: {
          taskId,
          taskTitle,
          dueDate,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendProjectAssignedAlert(
    projectId: string,
    employeePhone: string,
    projectName: string,
    dueDate: string,
    domain: string,
    techStack: string[],
    role: string = 'Employee',
    startDate: string = new Date().toDateString(),
    objective: string = 'Not specified',
  ): Promise<void> {
    console.info(
      `[NotificationsService] Triggering project assignment alert for project ${projectId} to employee ${employeePhone}`,
    );

    await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone: employeePhone,
        },
        channels: ['WHATSAPP', 'EMAIL', 'SMS', 'IN_APP'],
        template: 'PROJECT_ASSIGNED',
        variables: {
          projectId,
          projectName,
          dueDate,
          domain: domain || 'Not specified',
          techStack: techStack && techStack.length > 0 ? techStack.join(', ') : 'Not specified',
          role,
          startDate,
          objective,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendCustomReminder(
    phone: string,
    message: string,
    name?: string,
    taskId?: string,
  ): Promise<{
    success: boolean;
    jobId: string | number;
    recipientPhone: string;
    message: string;
  }> {
    console.info(`[NotificationsService] Triggering custom WhatsApp reminder to phone: ${phone}`);

    const job = await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone,
          name: name || 'Team Member',
        },
        channels: ['WHATSAPP', 'EMAIL', 'SMS'],
        template: 'CUSTOM_REMINDER',
        variables: {
          message,
          taskId,
          recipientName: name,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    return {
      success: true,
      jobId: job.id || 'job-queued',
      recipientPhone: phone,
      message: 'WhatsApp reminder queued successfully',
    };
  }

  // In-memory Automatic Reminders store for project reminder tracking
  private reminderSchedules: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    employeePhone: string;
    projectName: string;
    projectDescription: string;
    priority: string;
    startDate: string;
    deadline: string;
    assignedManager: string;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
    nextReminderDate: string;
    history: Array<{
      id: string;
      timestamp: string;
      message: string;
      status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
      phone: string;
    }>;
  }> = [
    {
      id: 'rem_sched_101',
      employeeName: 'Rahul Sharma',
      employeeId: 'EMP-005',
      employeePhone: '+918105670193',
      projectName: 'Mobile Banking Dashboard',
      projectDescription: 'Build responsive Next.js analytics and transaction tracking dashboard.',
      priority: 'HIGH',
      startDate: '2026-07-20',
      deadline: '2026-07-30',
      assignedManager: 'Manager Lead',
      status: 'ACTIVE',
      nextReminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      history: [
        {
          id: 'log_01',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          message:
            'Hello Rahul Sharma, This is your daily project reminder from Axiom. Project: Mobile Banking Dashboard, Deadline: 30 July 2026 (6 days remaining).',
          status: 'DELIVERED',
          phone: '+918105670193',
        },
      ],
    },
    {
      id: 'rem_sched_102',
      employeeName: 'Sarah Jenkins',
      employeeId: 'EMP-002',
      employeePhone: '+19998887777',
      projectName: 'Payment Gateway Integration',
      projectDescription: 'Integrate Stripe and Razorpay webhooks with idempotency handling.',
      priority: 'MEDIUM',
      startDate: '2026-07-15',
      deadline: '2026-08-05',
      assignedManager: 'Tech Manager',
      status: 'ACTIVE',
      nextReminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      history: [],
    },
  ];

  async getReminderSchedules() {
    return this.reminderSchedules;
  }

  async createReminderSchedule(data: {
    employeeName: string;
    employeeId?: string;
    employeePhone: string;
    projectName: string;
    projectDescription?: string;
    deadline?: string;
  }) {
    const id = `rem_sched_${Date.now()}`;
    const targetDeadline = data.deadline || '2026-07-30';
    const targetPhone = data.employeePhone.trim().replace(/[\s\-()]/g, '');

    const newSchedule = {
      id,
      employeeName: data.employeeName || 'Team Member',
      employeeId: data.employeeId || 'EMP-' + Math.floor(100 + Math.random() * 900),
      employeePhone: targetPhone,
      projectName: data.projectName || 'Assigned Project',
      projectDescription: data.projectDescription || 'Custom project assigned by manager.',
      priority: 'HIGH',
      startDate: new Date().toISOString().split('T')[0],
      deadline: targetDeadline,
      assignedManager: 'Manager Lead',
      status: 'ACTIVE' as const,
      nextReminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      history: [],
    };

    // Unshift so manager created schedule appears at the top!
    this.reminderSchedules.unshift(newSchedule);

    // Trigger immediate initial WhatsApp reminder
    await this.triggerScheduledReminder(id, targetPhone);

    return {
      success: true,
      schedule: newSchedule,
      message: `Automatic reminder schedule created for ${data.employeeName} (${targetPhone})!`,
    };
  }

  async triggerScheduledReminder(scheduleId: string, customPhone?: string, aiTone?: string) {
    const schedule = this.reminderSchedules.find((s) => s.id === scheduleId);
    const targetPhone = customPhone || schedule?.employeePhone || '+918105670193';
    const employeeName = schedule?.employeeName || 'Team Member';
    const projectName = schedule?.projectName || 'Assigned Project';
    const deadline = schedule?.deadline || 'Upcoming';

    // Calculate days remaining
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const reminderMsg =
      `Hello ${employeeName},\n\n` +
      `This is your daily project reminder from Axiom.\n\n` +
      `• Project: ${projectName}\n` +
      `• Deadline: ${deadline}\n` +
      `• Time Remaining: ${daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}\n\n` +
      `Please ensure your project is progressing according to schedule. If you expect any delays, kindly inform your manager.\n\n` +
      `Best regards,\nAxiom Assistant`;

    const job = await this.notificationsQueue.add(
      'send-notification',
      {
        recipient: {
          phone: targetPhone,
          name: employeeName,
        },
        channels: ['WHATSAPP'],
        template: 'AI_AUTOMATIC_REMINDER',
        variables: {
          message: reminderMsg,
          projectName,
          daysRemaining,
        },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: reminderMsg,
      status: 'DELIVERED' as const,
      phone: targetPhone,
    };

    if (schedule) {
      schedule.history.unshift(logEntry);
      schedule.nextReminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      success: true,
      jobId: job.id || 'job-queued',
      recipientPhone: targetPhone,
      message: reminderMsg,
      log: logEntry,
    };
  }

  async updateScheduleStatus(id: string, status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED') {
    const schedule = this.reminderSchedules.find((s) => s.id === id);
    if (schedule) {
      schedule.status = status;
    }
    return { success: true, id, status };
  }
}
