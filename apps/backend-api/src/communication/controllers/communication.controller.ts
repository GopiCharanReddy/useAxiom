import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TemplateService } from '../services/template.service';
import { NotificationHistoryService } from '../services/notification-history.service';
import { ReminderRulesService } from '../services/reminder-rules.service';
import { MetaWhatsappService } from '../services/meta-whatsapp.service';
import { CommunicationMonitoringService } from '../services/communication-monitoring.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { SendTestWhatsappDto } from '../dto/send-test-whatsapp.dto';

@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly historyService: NotificationHistoryService,
    private readonly reminderRulesService: ReminderRulesService,
    private readonly metaWhatsappService: MetaWhatsappService,
    private readonly monitoringService: CommunicationMonitoringService,
  ) {}

  // ---------------------------------------------------------------------------
  // Phase 2.5 Monitoring & DLQ Endpoints
  // ---------------------------------------------------------------------------

  @Get('queue')
  @Roles('ADMIN', 'MANAGER')
  getQueueStats() {
    return this.monitoringService.getQueueStats();
  }

  @Get('health')
  @Roles('ADMIN', 'MANAGER')
  getHealthStatus() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('diagnostics/:id')
  @Roles('ADMIN', 'MANAGER')
  getDiagnostics(@Param('id') id: string) {
    return this.monitoringService.getDiagnostics(id);
  }

  @Get('dead-letter')
  @Roles('ADMIN', 'MANAGER')
  getDeadLetterQueue() {
    return this.monitoringService.getDeadLetterQueue();
  }

  @Post('retry/:id')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  retryMessage(@Param('id') id: string) {
    return this.monitoringService.retryMessage(id);
  }

  @Post('replay/:id')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  replayMessage(@Param('id') id: string) {
    return this.monitoringService.replayMessage(id);
  }

  @Post('cancel/:id')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  cancelMessage(@Param('id') id: string) {
    return this.monitoringService.cancelMessage(id);
  }

  @Post('test-simulation')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  runSimulation(@Body() body: { type: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'WEBHOOK'; recipientPhone?: string }) {
    return this.monitoringService.runTestSimulation(body.type, body.recipientPhone);
  }

  // ---------------------------------------------------------------------------
  // Meta Config & WhatsApp Test Endpoints
  // ---------------------------------------------------------------------------

  @Get('meta-config')
  @Roles('ADMIN', 'MANAGER')
  getMetaConfig() {
    return this.metaWhatsappService.getConfigStatus();
  }

  @Post('test-whatsapp')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  sendTestWhatsapp(@Body() dto: SendTestWhatsappDto) {
    return this.metaWhatsappService.sendTextMessage(dto.recipientPhone, dto.message);
  }

  // ---------------------------------------------------------------------------
  // Template Endpoints
  // ---------------------------------------------------------------------------

  @Get('templates')
  @Roles('ADMIN', 'MANAGER')
  findAllTemplates(@CurrentUser() user: any) {
    return this.templateService.findAll(user.organizationId);
  }

  @Post('templates')
  @Roles('ADMIN', 'MANAGER')
  createTemplate(@CurrentUser() user: any, @Body() dto: CreateTemplateDto) {
    return this.templateService.create(user.organizationId, dto);
  }

  @Get('templates/:id')
  @Roles('ADMIN', 'MANAGER')
  findOneTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.findOne(user.organizationId, id);
  }

  @Post('templates/:id/enable')
  @Roles('ADMIN', 'MANAGER')
  enableTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.enable(user.organizationId, id);
  }

  @Post('templates/:id/disable')
  @Roles('ADMIN', 'MANAGER')
  disableTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.disable(user.organizationId, id);
  }

  @Post('templates/:id/duplicate')
  @Roles('ADMIN', 'MANAGER')
  duplicateTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.duplicate(user.organizationId, id);
  }

  @Delete('templates/:id')
  @Roles('ADMIN', 'MANAGER')
  deleteTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.softDelete(user.organizationId, id);
  }

  @Post('templates/:id/preview')
  @Roles('ADMIN', 'MANAGER')
  previewTemplate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() sampleVariables?: Record<string, string>,
  ) {
    return this.templateService.preview(user.organizationId, id, sampleVariables);
  }

  // ---------------------------------------------------------------------------
  // History & Audit Log Endpoints
  // ---------------------------------------------------------------------------

  @Get('history')
  @Roles('ADMIN', 'MANAGER')
  findHistory(
    @CurrentUser() user: any,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.historyService.findAll(user.organizationId, {
      channel,
      deliveryStatus: status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('history/stats')
  @Roles('ADMIN', 'MANAGER')
  getStats(@CurrentUser() user: any) {
    return this.historyService.getStats(user.organizationId);
  }

  @Post('seed-defaults')
  @Roles('ADMIN', 'MANAGER')
  seedDefaults(@CurrentUser() user: any) {
    return this.templateService.seedDefaults(user.organizationId);
  }
}
