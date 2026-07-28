import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@useaxiom/database';
import type { Request } from 'express';

interface ActiveUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  async chat(
    @CurrentUser() user: ActiveUser,
    @Body('message') message: string,
    @Body('threadId') threadId: string,
  ) {
    const orchestrator = this.aiService.getOrchestrator();
    const conversationThread = threadId || `user-thread-${user.id}`;
    const organizationId = user.organizationId;

    try {
      const response = await orchestrator.getConversation().run({
        threadId: conversationThread,
        message: message || 'Hello',
      });

      const promptLower = (message || '').toLowerCase();
      let projectCreated = false;
      let createdProject: any = null;

      // Check if message intent implies project creation or employee assignment
      if (
        promptLower.includes('assign') ||
        promptLower.includes('create project') ||
        promptLower.includes('new project') ||
        promptLower.includes('mobile banking') ||
        promptLower.includes('deadline') ||
        promptLower.includes('employee')
      ) {
        const managerId = user.id;

        // Extract title or fallback
        const projName = promptLower.includes('mobile banking')
          ? 'Mobile Banking Dashboard'
          : promptLower.includes('payment')
            ? 'Payment Gateway Integration'
            : 'AI Assigned Goal';

        const phoneMatch = message?.match(/\+?[1-9]\d{8,14}/);
        const recipientPhone = phoneMatch ? phoneMatch[0] : '+918105670193';

        // Persist project record scoped to user's tenant organization
        createdProject = await this.prisma.project.create({
          data: {
            name: projName,
            objective: `AI Assigned project: ${message}`,
            targetDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            domain: 'Engineering',
            techStack: ['TypeScript', 'Next.js', 'NestJS'],
            organization: { connect: { id: organizationId } },
            manager: { connect: { id: managerId } },
          },
        });

        // Create automatic WhatsApp reminder schedule
        await this.notificationsService.createReminderSchedule({
          employeeName: promptLower.includes('rahul') ? 'Rahul Sharma' : 'Assigned Employee',
          employeeId: 'EMP-005',
          employeePhone: recipientPhone,
          projectName: projName,
          projectDescription: `AI Assigned project: ${message}`,
          deadline: '2026-07-30',
        });

        projectCreated = true;
      }

      return {
        success: true,
        projectCreated,
        project: createdProject,
        data: response,
      };
    } catch (error: any) {
      console.error('Error in AiController chat:', error);
      return {
        success: false,
        error: error.message || 'Failed to process AI chat request',
      };
    }
  }
}
