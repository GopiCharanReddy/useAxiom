import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import type { Request } from 'express';

/**
 * TwilioController – handles inbound WhatsApp messages from the Twilio Sandbox.
 *
 * Twilio sends form-encoded POST requests (application/x-www-form-urlencoded)
 * to this webhook with fields like From, To, Body, etc.
 *
 * The payload is normalised and pushed to the `incoming_messages` BullMQ queue
 * so the existing IncomingMessagesWorker can process it without changes.
 *
 * Webhook URL to set in Twilio Console:
 *   https://<your-ngrok-id>.ngrok-free.app/api/webhooks/twilio
 */
@Controller('webhooks/twilio')
export class TwilioController {
  constructor(
    @InjectQueue('incoming_messages') private readonly incomingQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async handleTwilioWebhook(
    @Req() req: Request,
    @Body() body: Record<string, string>,
    @Headers('x-twilio-signature') twilioSignature: string,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');

    // Validate Twilio signature when credentials are configured
    const hasRealCredentials =
      accountSid &&
      authToken &&
      !accountSid.startsWith('your_') &&
      !authToken.startsWith('your_');

    if (hasRealCredentials && twilioSignature) {
      const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = twilio.validateRequest(authToken, twilioSignature, webhookUrl, body);
      if (!isValid) {
        console.warn('[TwilioWebhook] Invalid Twilio signature — request rejected');
        throw new HttpException('Invalid Twilio signature', HttpStatus.FORBIDDEN);
      }
      console.info('[TwilioWebhook] Twilio signature verified successfully');
    } else {
      console.warn('[TwilioWebhook] Twilio credentials not set or missing signature — skipping signature check (dev mode)');
    }

    // Extract message fields from Twilio's form-encoded payload
    const fromRaw = body['From'] || ''; // e.g. "whatsapp:+919876543210"
    const messageBody = body['Body'] || '';
    const profileName = body['ProfileName'] || 'Employee';

    // Strip the "whatsapp:" prefix to get the raw phone number
    const waId = fromRaw.replace(/^whatsapp:/, '');

    if (!waId || !messageBody) {
      console.warn('[TwilioWebhook] Received webhook with empty From or Body — ignoring');
      return '<Response></Response>';
    }

    console.info(
      `[TwilioWebhook] Received inbound message from ${fromRaw} (${profileName}): "${messageBody}"`,
    );

    // Normalise into the flat payload format the IncomingMessagesWorker understands
    await this.incomingQueue.add(
      'process_webhook',
      {
        payload: {
          text: messageBody,
          waId,
          name: profileName,
          source: 'twilio',
        },
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    // Twilio expects an empty TwiML response (or a <Message> TwiML reply).
    // We return empty TwiML — the actual reply is sent asynchronously via
    // the outgoing_messages queue → outgoing-messages.worker.ts → Twilio REST API.
    return '<Response></Response>';
  }
}
