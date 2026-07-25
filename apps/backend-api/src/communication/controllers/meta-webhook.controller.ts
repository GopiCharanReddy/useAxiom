import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('communication/webhook')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/v1/communication/webhook
   * Meta Webhook Verification Handshake Endpoint.
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('[MetaWebhook] Webhook verification successful');
      return challenge;
    }

    this.logger.warn(`[MetaWebhook] Verification failed. Received token: ${token}`);
    throw new ForbiddenException('Webhook verification failed: Invalid verify token');
  }

  /**
   * POST /api/v1/communication/webhook
   * Meta Status Callback Endpoint — receives message status updates (sent, delivered, read, failed).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStatusCallback(@Body() body: any) {
    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const statuses = value?.statuses;

      if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return { status: 'ignored' };
      }

      for (const statusObj of statuses) {
        const metaMessageId = statusObj.id;
        const statusStr = (statusObj.status as string)?.toUpperCase();
        const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

        if (!metaMessageId) continue;

        let dbStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null = null;
        const updateData: any = {};

        if (statusStr === 'SENT') {
          dbStatus = 'SENT';
          updateData.sentAt = timestamp;
        } else if (statusStr === 'DELIVERED') {
          dbStatus = 'DELIVERED';
          updateData.deliveredAt = timestamp;
        } else if (statusStr === 'READ') {
          dbStatus = 'READ';
        } else if (statusStr === 'FAILED') {
          dbStatus = 'FAILED';
          const errorMsg = statusObj.errors?.[0]?.title || 'Meta delivery failed';
          updateData.errorMessage = errorMsg;
        }

        if (dbStatus) {
          updateData.deliveryStatus = dbStatus;
          updateData.apiResponse = statusObj;

          await this.prisma.notificationHistory.updateMany({
            where: { metaMessageId },
            data: updateData,
          });

          this.logger.log(`[MetaWebhook] Updated status to ${dbStatus} for wamid: ${metaMessageId}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`[MetaWebhook] Error processing callback: ${err.message}`);
    }

    return { status: 'success' };
  }
}
