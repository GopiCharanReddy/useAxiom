import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../modules/queue/queue.module';

// Services
import { EventPublisherService } from './services/event-publisher.service';
import { TemplateService } from './services/template.service';
import { ReminderRulesService } from './services/reminder-rules.service';
import { NotificationHistoryService } from './services/notification-history.service';
import { CommunicationService } from './services/communication.service';
import { MetaWhatsappService } from './services/meta-whatsapp.service';

// Controllers
import { CommunicationController } from './controllers/communication.controller';
import { ReminderRulesController } from './controllers/reminder-rules.controller';
import { MetaWebhookController } from './controllers/meta-webhook.controller';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [
    CommunicationController,
    ReminderRulesController,
    MetaWebhookController,
  ],
  providers: [
    EventPublisherService,
    TemplateService,
    ReminderRulesService,
    NotificationHistoryService,
    CommunicationService,
    MetaWhatsappService,
  ],
  exports: [
    EventPublisherService,
    CommunicationService,
    MetaWhatsappService,
  ],
})
export class CommunicationModule {}
