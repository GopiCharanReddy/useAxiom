import { Module } from '@nestjs/common';
import { CommunicationController } from './controllers/communication.controller';
import { ReminderRulesController } from './controllers/reminder-rules.controller';
import { MetaWebhookController } from './controllers/meta-webhook.controller';
import { EventPublisherService } from './services/event-publisher.service';
import { TemplateService } from './services/template.service';
import { NotificationHistoryService } from './services/notification-history.service';
import { ReminderRulesService } from './services/reminder-rules.service';
import { MetaWhatsappService } from './services/meta-whatsapp.service';
import { CommunicationMonitoringService } from './services/communication-monitoring.service';

@Module({
  controllers: [
    CommunicationController,
    ReminderRulesController,
    MetaWebhookController,
  ],
  providers: [
    EventPublisherService,
    TemplateService,
    NotificationHistoryService,
    ReminderRulesService,
    MetaWhatsappService,
    CommunicationMonitoringService,
  ],
  exports: [
    EventPublisherService,
    TemplateService,
    NotificationHistoryService,
    ReminderRulesService,
    MetaWhatsappService,
    CommunicationMonitoringService,
  ],
})
export class CommunicationModule {}
