import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EventPublisherService } from './event-publisher.service';
import { NotificationEventType, NotificationChannel } from '../events/notification-event.types';

/**
 * CommunicationService — high-level orchestrator for manual notification actions.
 *
 * Provides:
 *  - Manual notification dispatch (any user, any template)
 *  - Settings management (per-org channels, quiet hours)
 *  - Default template seeding
 */
@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  /**
   * Publish a manual notification event (e.g., from the Communication Center UI).
   */
  async publishManualNotification(
    organizationId: string,
    actorId: string,
    recipientUserId: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
  ) {
    this.logger.log(
      `[CommunicationService] Manual notification from ${actorId} to ${recipientUserId}`,
    );

    const recipient = await this.prisma.user.findFirst({
      where: { id: recipientUserId, organizationId, deletedAt: null },
    });
    if (!recipient) return { success: false, reason: 'Recipient not found' };

    // Create a direct-send job without going through rule matching
    const event = await this.prisma.notificationEvent.create({
      data: {
        organizationId,
        eventType: 'MANUAL_NOTIFICATION' as any,
        entityType: 'manual',
        entityId: recipientUserId,
        actorId,
        payload: { message, recipientName: recipient.name } as any,
      },
    });

    const historyRecord = await this.prisma.notificationHistory.create({
      data: {
        organizationId,
        eventId: event.id,
        recipientUserId,
        recipientPhone: recipient.phoneNumber,
        recipientName: recipient.name,
        channel: channel as any,
        renderedBody: message,
        deliveryStatus: 'PENDING',
      },
    });

    await this.notificationsQueue.add(
      'send-communication-event',
      {
        historyId: historyRecord.id,
        organizationId,
        channel,
        recipient: {
          phone: recipient.phoneNumber,
          name: recipient.name,
        },
        renderedBody: message,
        eventType: NotificationEventType.MANUAL_NOTIFICATION,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { success: true, historyId: historyRecord.id, eventId: event.id };
  }

  /**
   * Seed default templates for every event type.
   * Safe to call multiple times — uses upsert semantics.
   * Only creates templates that don't already exist (by name + org).
   */
  async seedDefaultTemplates(organizationId: string): Promise<{ seeded: number }> {
    const defaults = this.getDefaultTemplates();
    let seeded = 0;

    for (const tpl of defaults) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: { organizationId, name: tpl.name, deletedAt: null },
      });
      if (!existing) {
        await this.prisma.notificationTemplate.create({
          data: { ...tpl, organizationId, isDefault: true },
        });
        seeded++;
      }
    }

    this.logger.log(`[CommunicationService] Seeded ${seeded} default templates for org ${organizationId}`);
    return { seeded };
  }

  private getDefaultTemplates() {
    return [
      {
        name: 'Project Created',
        description: 'Sent to the project manager when a new project is created',
        eventType: 'PROJECT_CREATED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Projects',
        body: `Hello {{managerName}},\n\nA new project has been created!\n\n📋 Project: {{projectName}}\n🏢 Organization: {{organizationName}}\n\nYou have been assigned as the project manager. Log in to view details:\n{{portalLink}}\n\nBest regards,\nuseAxiom`,
      },
      {
        name: 'Project Completed',
        description: 'Sent to the team when a project is marked as completed',
        eventType: 'PROJECT_COMPLETED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Projects',
        body: `🎉 Congratulations {{employeeName}},\n\nProject "{{projectName}}" has been successfully completed!\n\nThank you for your contribution. View the final report:\n{{portalLink}}\n\nuseAxiom`,
      },
      {
        name: 'Employee Added to Project',
        description: 'Sent to an employee when they are assigned to a project',
        eventType: 'EMPLOYEE_ADDED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Projects',
        body: `Hello {{employeeName}},\n\nYou have been assigned to a new project!\n\n📋 Project: {{projectName}}\n📅 Deadline: {{deadline}}\n👔 Manager: {{managerName}}\n\nLog in to view your tasks:\n{{portalLink}}\n\nBest regards,\nuseAxiom`,
      },
      {
        name: 'Employee Removed from Project',
        description: 'Sent to an employee when they are removed from a project',
        eventType: 'EMPLOYEE_REMOVED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Projects',
        body: `Hello {{employeeName}},\n\nYou have been removed from the project "{{projectName}}".\n\nIf you have questions, please contact your manager.\n\nuseAxiom`,
      },
      {
        name: 'Task Created',
        description: 'Sent when a new task is created under a project',
        eventType: 'TASK_CREATED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Tasks',
        body: `Hello {{employeeName}},\n\nA new task has been created:\n\n✅ Task: {{taskName}}\n📋 Project: {{projectName}}\n⚡ Priority: {{priority}}\n\nView task details: {{portalLink}}\n\nuseAxiom`,
      },
      {
        name: 'Task Assigned',
        description: 'Sent to an employee when a task is assigned to them',
        eventType: 'TASK_ASSIGNED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Tasks',
        body: `Hello {{employeeName}},\n\nA task has been assigned to you:\n\n✅ Task: {{taskName}}\n📋 Project: {{projectName}}\n⚡ Priority: {{priority}}\n📅 Deadline: {{deadline}}\n\nView and start your task: {{portalLink}}\n\nBest regards,\nuseAxiom`,
      },
      {
        name: 'Task Completed',
        description: 'Sent to the manager when a task is completed',
        eventType: 'TASK_COMPLETED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Tasks',
        body: `Hello {{managerName}},\n\n✅ Task Completed!\n\n📌 Task: {{taskName}}\n📋 Project: {{projectName}}\n👤 Completed by: {{employeeName}}\n\nView the task: {{portalLink}}\n\nuseAxiom`,
      },
      {
        name: 'Task Overdue',
        description: 'Sent when a task is past its deadline',
        eventType: 'TASK_OVERDUE' as any,
        channel: 'WHATSAPP' as any,
        category: 'Tasks',
        body: `⚠️ OVERDUE ALERT — {{employeeName}}\n\nThe following task is past its deadline:\n\n📌 Task: {{taskName}}\n📋 Project: {{projectName}}\n📅 Was due: {{deadline}}\n\nPlease update the task status immediately: {{portalLink}}\n\nuseAxiom`,
      },
      {
        name: 'Goal / Milestone Created',
        description: 'Sent when a new milestone is created',
        eventType: 'GOAL_CREATED' as any,
        channel: 'WHATSAPP' as any,
        category: 'Goals',
        body: `Hello {{managerName}},\n\nA new milestone has been added to "{{projectName}}":\n\n🎯 Milestone: {{goalName}}\n📅 Target: {{deadline}}\n\nView milestone: {{portalLink}}\n\nuseAxiom`,
      },
      {
        name: 'Daily Summary',
        description: 'Daily summary of project and task activity',
        eventType: 'DAILY_SUMMARY' as any,
        channel: 'WHATSAPP' as any,
        category: 'Summaries',
        body: `Good morning {{employeeName}},\n\nHere is your daily summary from useAxiom:\n\n{{reason}}\n\nHave a productive day!\n\nBest regards,\nuseAxiom`,
      },
      {
        name: 'Manual Notification',
        description: 'Used for manual notifications sent from the Communication Center',
        eventType: 'MANUAL_NOTIFICATION' as any,
        channel: 'WHATSAPP' as any,
        category: 'Manual',
        body: `{{reason}}`,
      },
    ];
  }
}
