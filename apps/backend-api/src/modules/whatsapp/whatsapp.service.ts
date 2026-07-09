import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WhatsappService {
  constructor(@InjectQueue('outgoing_messages') private readonly outgoingQueue: Queue) {}

  async enqueueOutboundMessage(to: string, content: string): Promise<void> {
    console.info(`[WhatsappService] Enqueuing outbound message to ${to}`);
    await this.outgoingQueue.add('send_message', {
      to,
      content,
      timestamp: new Date().toISOString(),
    });
  }
}
