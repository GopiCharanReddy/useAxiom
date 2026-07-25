import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * NotificationHistoryService — read-only queries for notification delivery logs.
 *
 * This service provides the data for the Communication Center history and analytics pages.
 * History records are written by EventPublisherService and updated by the notifications worker.
 */
@Injectable()
export class NotificationHistoryService {
  private readonly logger = new Logger(NotificationHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      channel?: string;
      deliveryStatus?: string;
      eventType?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    return this.prisma.notificationHistory.findMany({
      where: {
        organizationId,
        ...(filters?.channel ? { channel: filters.channel as any } : {}),
        ...(filters?.deliveryStatus ? { deliveryStatus: filters.deliveryStatus as any } : {}),
        ...(filters?.eventType
          ? { event: { eventType: filters.eventType as any } }
          : {}),
      },
      include: {
        event: { select: { id: true, eventType: true, entityType: true, entityId: true, actorId: true } },
        template: { select: { id: true, name: true, channel: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getStats(organizationId: string) {
    const [total, sent, delivered, failed, pending] = await Promise.all([
      this.prisma.notificationHistory.count({ where: { organizationId } }),
      this.prisma.notificationHistory.count({ where: { organizationId, deliveryStatus: 'SENT' } }),
      this.prisma.notificationHistory.count({ where: { organizationId, deliveryStatus: 'DELIVERED' } }),
      this.prisma.notificationHistory.count({ where: { organizationId, deliveryStatus: 'FAILED' } }),
      this.prisma.notificationHistory.count({ where: { organizationId, deliveryStatus: 'PENDING' } }),
    ]);

    const deliveryRate = total > 0 ? Math.round(((sent + delivered) / total) * 100) : 0;

    return { total, sent, delivered, failed, pending, deliveryRate };
  }

  async getEventLog(organizationId: string, limit = 50) {
    return this.prisma.notificationEvent.findMany({
      where: { organizationId },
      include: {
        history: {
          select: { id: true, channel: true, deliveryStatus: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
