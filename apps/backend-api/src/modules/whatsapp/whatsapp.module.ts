import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '../queue/queue.module';
import { WhatsappController } from './whatsapp.controller';
import { TwilioController } from './twilio.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [ConfigModule, QueueModule],
  controllers: [WhatsappController, TwilioController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
