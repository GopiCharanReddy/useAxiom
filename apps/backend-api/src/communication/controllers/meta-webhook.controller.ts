import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '@useaxiom/database';

@Controller('communication/webhook')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);

  /**
   * Meta Webhook Verification Handshake (GET /api/v1/communication/webhook)
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'useaxiom_webhook_token';

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('[MetaWebhookController] Webhook verification succeeded!');
      return challenge;
    }

    this.logger.warn(`[MetaWebhookController] Webhook verification failed. Invalid verify token: ${token}`);
    throw new BadRequestException('Webhook verification failed: Invalid verify token');
  }

  /**
   * Meta Status Callbacks Receiver (POST /api/v1/communication/webhook)
   * Receives status receipts (sent, delivered, read, failed)
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhookPayload(@Body() body: Record<string, any>) {
    this.logger.log(`[MetaWebhookController] Webhook payload received: ${JSON.stringify(body)}`);

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const statusObj = value?.statuses?.[0];

      if (!statusObj) {
        return { status: 'IGNORED', reason: 'No status object in webhook entry' };
      }

      const metaMessageId = statusObj.id; // Meta wamid
      const metaStatus = statusObj.status; // "sent" | "delivered" | "read" | "failed"
      const timestampSeconds = parseInt(statusObj.timestamp, 10) || Math.floor(Date.now() / 1000);
      const eventTime = new Date(timestampSeconds * 1000);

      this.logger.log(`[MetaWebhookController] Processing status update for wamid ${metaMessageId}: ${metaStatus}`);

      // Transaction-safe lookup and state transition check
      await prisma.$transaction(async (tx) => {
        const history = await tx.notificationHistory.findFirst({
          where: { metaMessageId },
        });

        if (!history) {
          this.logger.warn(`[MetaWebhookController] No NotificationHistory record found for wamid ${metaMessageId}`);
          return;
        }

        // Deduplication & State Ordering Hierarchy: QUEUED (0) < PROCESSING (1) < SENT (2) < DELIVERED (3) < READ (4)
        const statusHierarchy: Record<string, number> = {
          QUEUED: 0,
          PROCESSING: 1,
          PENDING: 1,
          SENT: 2,
          DELIVERED: 3,
          READ: 4,
          FAILED: 5,
        };

        const currentRank = statusHierarchy[history.deliveryStatus] ?? 0;

        let targetStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' = 'SENT';
        const updateData: Record<string, any> = {};

        if (metaStatus === 'sent') {
          targetStatus = 'SENT';
          updateData.sentAt = history.sentAt || eventTime;
        } else if (metaStatus === 'delivered') {
          targetStatus = 'DELIVERED';
          updateData.deliveredAt = history.deliveredAt || eventTime;
          if (history.queuedAt || history.sentAt) {
            const startTime = history.queuedAt || history.sentAt;
            updateData.deliveryLatencyMs = Math.max(0, eventTime.getTime() - new Date(startTime!).getTime());
          }
        } else if (metaStatus === 'read') {
          targetStatus = 'READ';
          updateData.readAt = history.readAt || eventTime;
          if (!history.deliveredAt) updateData.deliveredAt = eventTime;
        } else if (metaStatus === 'failed') {
          targetStatus = 'FAILED';
          updateData.failedAt = eventTime;
          const errorErr = statusObj.errors?.[0];
          updateData.errorMessage = errorErr?.title ? `${errorErr.title}: ${errorErr.message}` : 'Meta delivery failed';
          updateData.failureCategory = 'WEBHOOK_DELIVERY_FAILURE';
        }

        const newRank = statusHierarchy[targetStatus] ?? 0;

        // Skip if this update is out-of-order (e.g. DELIVERED arrives after READ)
        if (currentRank >= newRank && history.deliveryStatus !== 'FAILED' && targetStatus !== 'FAILED') {
          this.logger.log(`[MetaWebhookController] Skipping out-of-order or duplicate webhook event ${metaStatus} for ${metaMessageId}`);
          return;
        }

        updateData.deliveryStatus = targetStatus;
        updateData.completedAt = (targetStatus === 'DELIVERED' || targetStatus === 'READ' || targetStatus === 'FAILED') ? eventTime : history.completedAt;

        // Structured JSON audit log append
        const existingLogs = Array.isArray(history.webhookLogs) ? history.webhookLogs : [];
        const newLogEntry = {
          eventId: statusObj.id,
          metaStatus,
          timestamp: eventTime.toISOString(),
          errors: statusObj.errors || null,
          recipientId: statusObj.recipient_id || null,
        };

        updateData.webhookLogs = [...existingLogs, newLogEntry];

        await tx.notificationHistory.update({
          where: { id: history.id },
          data: updateData,
        });

        this.logger.log(`[MetaWebhookController] NotificationHistory ${history.id} updated to status ${targetStatus}`);
      });

      return { status: 'SUCCESS', metaMessageId, metaStatus };
    } catch (err: any) {
      this.logger.error(`[MetaWebhookController] Failed to process webhook: ${err.message}`, err.stack);
      return { status: 'ERROR', message: err.message };
    }
  }
}
