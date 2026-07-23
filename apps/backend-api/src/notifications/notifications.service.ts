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
}
