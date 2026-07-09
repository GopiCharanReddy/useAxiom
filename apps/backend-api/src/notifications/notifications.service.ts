import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private readonly whatsappService: WhatsappService,
  ) {}

  async sendTestNotification(userId: string, message: string) {
    const job = await this.notificationsQueue.add('test-notification', {
      userId,
      message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Notification job queued successfully',
    };
  }

  async triggerOrganizationSummary(orgId: string): Promise<void> {
    console.info(`[NotificationsService] Triggering summary broadcast for org: ${orgId}`);

    const mockEmployees = [
      { name: 'David', phone: '+1234567890' },
      { name: 'Sarah', phone: '+0987654321' },
    ];

    for (const employee of mockEmployees) {
      const summaryMsg = `Hello ${employee.name}, here is your daily task summary for today in useAxiom. Make sure to update your task status via WhatsApp!`;
      await this.whatsappService.enqueueOutboundMessage(employee.phone, summaryMsg);
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
    const message = `⚠️ Blocker Alert! Employee ${employeeName} has reported a blocker on task ID: ${taskId}. Reason: "${reason}". Please log into the dashboard or reply to resolve.`;
    await this.whatsappService.enqueueOutboundMessage(managerPhone, message);
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
    const message = `⏰ Reminder: Your task "${taskTitle}" is approaching its deadline. You have ${hoursRemaining} hour(s) remaining. Reply "Done" when completed or text us if you are blocked.`;
    await this.whatsappService.enqueueOutboundMessage(employeePhone, message);
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
    const message = `📋 New Task Assigned: You have been assigned "${taskTitle}" (ID: ${taskId}), due on ${dueDate}. Reply to confirm or get started.`;
    await this.whatsappService.enqueueOutboundMessage(employeePhone, message);
  }
}
