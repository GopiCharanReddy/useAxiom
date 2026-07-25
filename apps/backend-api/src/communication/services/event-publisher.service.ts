import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationEventType,
  NotificationEventPayload,
  NotificationTemplateVariables,
} from '../events/notification-event.types';

/**
 * EventPublisherService — single entry point for publishing all business events.
 *
 * Responsibilities:
 *  1. Persist a NotificationEvent record (immutable audit log)
 *  2. Find matching active ReminderRules for the event type + org
 *  3. For each rule: load the template, render it, write a PENDING NotificationHistory record
 *  4. Queue a `send-notification` job to the existing `notifications` BullMQ queue
 *
 * This service NEVER sends messages directly — it only enqueues.
 * Never publish before a successful DB write — callers are responsible.
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  /**
   * Publish a business event. Safe to call after any successful DB operation.
   * Failures here are logged but never propagated — they must not break business operations.
   */
  async publish(payload: NotificationEventPayload): Promise<void> {
    try {
      // 1. Persist the event record
      const event = await this.prisma.notificationEvent.create({
        data: {
          organizationId: payload.organizationId,
          eventType: payload.eventType as any,
          entityType: payload.entityType,
          entityId: payload.entityId,
          actorId: payload.actorId,
          payload: payload.variables as any,
        },
      });

      this.logger.log(
        `[EventPublisher] Published ${payload.eventType} for entity ${payload.entityId} (event: ${event.id})`,
      );

      // 2. Find matching active reminder rules
      const rules = await this.prisma.reminderRule.findMany({
        where: {
          organizationId: payload.organizationId,
          eventType: payload.eventType as any,
          isActive: true,
          deletedAt: null,
        },
        include: { template: true },
      });

      if (rules.length === 0) {
        this.logger.debug(
          `[EventPublisher] No active rules for ${payload.eventType} in org ${payload.organizationId}`,
        );
        return;
      }

      // 3. For each rule: render template and create history record + queue job
      for (const rule of rules) {
        const template = rule.template;
        if (!template || !template.isActive) continue;

        const renderedBody = this.renderTemplate(template.body, payload.variables);
        const renderedSubject = template.subject
          ? this.renderTemplate(template.subject, payload.variables)
          : undefined;

        // Create pending history record
        const historyRecord = await this.prisma.notificationHistory.create({
          data: {
            organizationId: payload.organizationId,
            eventId: event.id,
            templateId: template.id,
            channel: rule.channel as any,
            renderedSubject: renderedSubject ?? null,
            renderedBody,
            deliveryStatus: 'PENDING',
          },
        });

        // Queue the delivery job — the notifications worker handles actual dispatch
        await this.notificationsQueue.add(
          'send-communication-event',
          {
            historyId: historyRecord.id,
            organizationId: payload.organizationId,
            channel: rule.channel,
            recipient: payload.variables,
            renderedBody,
            renderedSubject,
            eventType: payload.eventType,
            delayMinutes: rule.delayMinutes,
          },
          {
            delay: rule.delayMinutes > 0 ? rule.delayMinutes * 60 * 1000 : undefined,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );

        this.logger.log(
          `[EventPublisher] Queued ${rule.channel} notification via template "${template.name}" (history: ${historyRecord.id})`,
        );
      }
    } catch (err) {
      // Log but never throw — event publishing must never break business operations
      this.logger.error(
        `[EventPublisher] Failed to publish ${payload.eventType}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Renders a template string by replacing {{placeholder}} tokens with actual values.
   * Unknown placeholders are left as-is for debugging visibility.
   */
  renderTemplate(template: string, variables: NotificationTemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }
}
