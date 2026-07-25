import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { EventPublisherService } from './event-publisher.service';

/**
 * TemplateService — manages the full lifecycle of notification templates.
 *
 * Supports: Create, Read, Update (soft), Delete (soft), Duplicate, Enable/Disable, Preview.
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(organizationId: string, dto: CreateTemplateDto) {
    this.logger.log(`[TemplateService] Creating template "${dto.name}" for org ${organizationId}`);
    return this.prisma.notificationTemplate.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        eventType: dto.eventType as any,
        channel: dto.channel as any,
        subject: dto.subject ?? null,
        body: dto.body,
        isActive: dto.isActive ?? true,
        category: dto.category ?? null,
      },
    });
  }

  async findAll(
    organizationId: string,
    filters?: {
      eventType?: string;
      channel?: string;
      isActive?: boolean;
      category?: string;
      search?: string;
    },
  ) {
    return this.prisma.notificationTemplate.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(filters?.eventType ? { eventType: filters.eventType as any } : {}),
        ...(filters?.channel ? { channel: filters.channel as any } : {}),
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { body: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(organizationId: string, id: string) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!template) {
      throw new NotFoundException(`Notification template with ID ${id} not found`);
    }
    return template;
  }

  async update(organizationId: string, id: string, dto: Partial<CreateTemplateDto>) {
    await this.findOne(organizationId, id);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType as any } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel as any } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
      },
    });
  }

  async softDelete(organizationId: string, id: string) {
    const template = await this.findOne(organizationId, id);
    if (template.isDefault) {
      throw new ConflictException('Cannot delete a system default template');
    }
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(organizationId: string, id: string) {
    const original = await this.findOne(organizationId, id);
    return this.prisma.notificationTemplate.create({
      data: {
        organizationId,
        name: `${original.name} (Copy)`,
        description: original.description,
        eventType: original.eventType,
        channel: original.channel,
        subject: original.subject,
        body: original.body,
        isActive: false, // copies start inactive
        isDefault: false,
        category: original.category,
        version: 1,
      },
    });
  }

  async setActive(organizationId: string, id: string, isActive: boolean) {
    await this.findOne(organizationId, id);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Preview a template with sample or provided variables.
   * Does NOT send any notification — pure rendering.
   */
  async preview(
    organizationId: string,
    id: string,
    variables?: Record<string, string>,
  ) {
    const template = await this.findOne(organizationId, id);
    const merged = {
      employeeName: 'John Doe',
      managerName: 'Jane Manager',
      projectName: 'Sample Project',
      taskName: 'Sample Task',
      goalName: 'Q3 Milestone',
      deadline: '2026-12-31',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      organizationName: 'Your Organization',
      portalLink: 'https://app.useaxiom.com',
      daysRemaining: '7',
      ...variables,
    };
    const renderedBody = this.eventPublisher.renderTemplate(template.body, merged);
    const renderedSubject = template.subject
      ? this.eventPublisher.renderTemplate(template.subject, merged)
      : null;
    return { renderedBody, renderedSubject, variables: merged };
  }

  async getCategories(organizationId: string): Promise<string[]> {
    const results = await this.prisma.notificationTemplate.findMany({
      where: { organizationId, deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return results.map((r) => r.category!).filter(Boolean);
  }
}
