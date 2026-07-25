import {
  Controller,
  Get,
  Post,
  Patch,
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
import { Role } from '@useaxiom/database';
import { TemplateService } from '../services/template.service';
import { NotificationHistoryService } from '../services/notification-history.service';
import { CommunicationService } from '../services/communication.service';
import { MetaWhatsappService } from '../services/meta-whatsapp.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { SendTestWhatsappDto } from '../dto/send-test-whatsapp.dto';

interface ActiveUser {
  id: string;
  organizationId: string;
  role: Role;
}

@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class CommunicationController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly historyService: NotificationHistoryService,
    private readonly communicationService: CommunicationService,
    private readonly metaWhatsappService: MetaWhatsappService,
  ) {}

  // ─── Templates ────────────────────────────────────────────────────────────

  @Get('templates')
  async listTemplates(
    @CurrentUser() user: ActiveUser,
    @Query('eventType') eventType?: string,
    @Query('channel') channel?: string,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.templateService.findAll(user.organizationId, {
      eventType,
      channel,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      category,
      search,
    });
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@CurrentUser() user: ActiveUser, @Body() dto: CreateTemplateDto) {
    return this.templateService.create(user.organizationId, dto);
  }

  @Get('templates/categories')
  async getCategories(@CurrentUser() user: ActiveUser) {
    return this.templateService.getCategories(user.organizationId);
  }

  @Get('templates/:id')
  async getTemplate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.templateService.findOne(user.organizationId, id);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @CurrentUser() user: ActiveUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
  ) {
    return this.templateService.update(user.organizationId, id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    await this.templateService.softDelete(user.organizationId, id);
  }

  @Post('templates/:id/duplicate')
  async duplicateTemplate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.templateService.duplicate(user.organizationId, id);
  }

  @Post('templates/:id/enable')
  async enableTemplate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.templateService.setActive(user.organizationId, id, true);
  }

  @Post('templates/:id/disable')
  async disableTemplate(@CurrentUser() user: ActiveUser, @Param('id') id: string) {
    return this.templateService.setActive(user.organizationId, id, false);
  }

  @Post('templates/:id/preview')
  async previewTemplate(
    @CurrentUser() user: ActiveUser,
    @Param('id') id: string,
    @Body() variables?: Record<string, string>,
  ) {
    return this.templateService.preview(user.organizationId, id, variables);
  }

  // ─── History & Events ──────────────────────────────────────────────────────

  @Get('history')
  async getHistory(
    @CurrentUser() user: ActiveUser,
    @Query('channel') channel?: string,
    @Query('deliveryStatus') deliveryStatus?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.historyService.findAll(user.organizationId, {
      channel,
      deliveryStatus,
      eventType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('history/stats')
  async getHistoryStats(@CurrentUser() user: ActiveUser) {
    return this.historyService.getStats(user.organizationId);
  }

  @Get('events')
  async getEventLog(
    @CurrentUser() user: ActiveUser,
    @Query('limit') limit?: string,
  ) {
    return this.historyService.getEventLog(
      user.organizationId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ─── Meta WhatsApp Cloud API Integration ────────────────────────────────────

  @Get('meta-config')
  getMetaConfig() {
    return this.metaWhatsappService.getConfigStatus();
  }

  @Post('test-whatsapp')
  async sendTestWhatsapp(
    @CurrentUser() user: ActiveUser,
    @Body() dto: SendTestWhatsappDto,
  ) {
    const result = await this.metaWhatsappService.sendTextMessage(
      dto.recipientPhone,
      dto.message,
    );

    return {
      success: result.success,
      metaMessageId: result.metaMessageId,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      apiResponse: result.apiResponse,
      requestTime: result.requestTime,
      responseTime: result.responseTime,
    };
  }

  // ─── Manual Notification ──────────────────────────────────────────────────

  @Post('send')
  async sendManual(
    @CurrentUser() user: ActiveUser,
    @Body() body: { recipientUserId: string; message: string; channel?: string },
  ) {
    return this.communicationService.publishManualNotification(
      user.organizationId,
      user.id,
      body.recipientUserId,
      body.message,
      body.channel as any,
    );
  }

  // ─── Template Seeding ─────────────────────────────────────────────────────

  @Post('seed-defaults')
  @Roles(Role.ADMIN)
  async seedDefaults(@CurrentUser() user: ActiveUser) {
    return this.communicationService.seedDefaultTemplates(user.organizationId);
  }
}
