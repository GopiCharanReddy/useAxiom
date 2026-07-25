import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderRuleDto } from '../dto/create-reminder-rule.dto';

/**
 * ReminderRulesService — CRUD management for notification delivery rules.
 *
 * Rules determine WHEN and HOW a notification is dispatched when an event fires.
 * Each rule maps: EventType × Channel → Template, with optional delay and conditions.
 */
@Injectable()
export class ReminderRulesService {
  private readonly logger = new Logger(ReminderRulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateReminderRuleDto) {
    this.logger.log(`[ReminderRules] Creating rule "${dto.name}" for org ${organizationId}`);
    return this.prisma.reminderRule.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        eventType: dto.eventType as any,
        channel: dto.channel as any,
        templateId: dto.templateId ?? null,
        isActive: dto.isActive ?? true,
        delayMinutes: dto.delayMinutes ?? 0,
        conditions: (dto.conditions as any) ?? undefined,
      },
      include: { template: { select: { id: true, name: true, channel: true } } },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.reminderRule.findMany({
      where: { organizationId, deletedAt: null },
      include: { template: { select: { id: true, name: true, channel: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const rule = await this.prisma.reminderRule.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { template: true },
    });
    if (!rule) {
      throw new NotFoundException(`Reminder rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(organizationId: string, id: string, dto: Partial<CreateReminderRuleDto>) {
    await this.findOne(organizationId, id);
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.eventType !== undefined) updateData.eventType = dto.eventType;
    if (dto.channel !== undefined) updateData.channel = dto.channel;
    if (dto.templateId !== undefined) updateData.templateId = dto.templateId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.delayMinutes !== undefined) updateData.delayMinutes = dto.delayMinutes;
    if (dto.conditions !== undefined) updateData.conditions = dto.conditions;

    return this.prisma.reminderRule.update({
      where: { id },
      data: updateData,
      include: { template: { select: { id: true, name: true, channel: true } } },
    });
  }

  async softDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.reminderRule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async setActive(organizationId: string, id: string, isActive: boolean) {
    await this.findOne(organizationId, id);
    return this.prisma.reminderRule.update({
      where: { id },
      data: { isActive },
    });
  }
}
