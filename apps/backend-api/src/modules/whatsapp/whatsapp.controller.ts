import { Controller, Get, Post, Body, Query, Headers, HttpException, HttpStatus, Req } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Request } from 'express';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    @InjectQueue('incoming_messages') private readonly incomingQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    console.info('[WhatsappController] Received webhook verification challenge');
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN', 'axiom_token');

    if (mode === 'subscribe' && token === verifyToken) {
      console.info('[WhatsappController] Webhook verified successfully');
      return challenge;
    }

    console.warn('[WhatsappController] Webhook verification failed');
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    console.info('[WhatsappController] Received webhook payload');

    // HMAC verification
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET', 'placeholder_secret');
    if (signature) {
      const signatureHash = signature.replace('sha256=', '');
      const rawBody = (req as any).rawBody;

      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawBody || JSON.stringify(payload))
        .digest('hex');

      if (signatureHash !== expectedHash) {
        console.warn('[WhatsappController] Webhook HMAC signature verification failed');
        throw new HttpException('Invalid webhook signature', HttpStatus.FORBIDDEN);
      }
      console.info('[WhatsappController] Webhook HMAC signature verified successfully');
    } else {
      console.warn('[WhatsappController] Webhook request lacks x-hub-signature-256 header');
      if (process.env.NODE_ENV === 'production') {
        throw new HttpException('Webhook request lacks signature header', HttpStatus.UNAUTHORIZED);
      }
    }

    // Immediately push to Redis queue and respond 200 OK
    await this.incomingQueue.add(
      'process_webhook',
      {
        payload,
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

    return { status: 'queued' };
  }
}
