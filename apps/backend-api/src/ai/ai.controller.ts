import { Controller, Post, Body, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  async chat(
    @Body('message') message: string,
    @Body('threadId') threadId: string,
    @Req() req: Request,
  ) {
    const orchestrator = this.aiService.getOrchestrator();
    const conversationThread = threadId || 'dashboard-thread';

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
        // Retrieve tenant organization and manager IDs
        const org = await this.prisma.organization.findFirst();
        const manager = await this.prisma.user.findFirst({
          where: { role: 'MANAGER' },
        });

        if (org && manager) {
          // Extract title or fallback
          const projName = promptLower.includes('mobile banking')
            ? 'Mobile Banking Dashboard'
            : promptLower.includes('payment')
              ? 'Payment Gateway Integration'
              : 'AI Assigned Goal';

          // Extract phone or fallback to test number
          const phoneMatch = message?.match(/\+?[1-9]\d{8,14}/);
          const recipientPhone = phoneMatch ? phoneMatch[0] : '+918105670193';

          // Persist project record in database
          createdProject = await this.prisma.project.create({
            data: {
              name: projName,
              objective: `AI Assigned project: ${message}`,
              targetDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'ACTIVE',
              domain: 'Engineering',
              techStack: ['TypeScript', 'Next.js', 'NestJS'],
              organization: { connect: { id: org.id } },
              manager: { connect: { id: manager.id } },
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
