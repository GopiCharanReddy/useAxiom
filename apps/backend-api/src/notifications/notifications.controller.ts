import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  async testNotification(@Body() body: { userId: string; message: string }) {
    return this.notificationsService.sendTestNotification(
      body.userId || 'mock-user-123',
      body.message || 'Hello from the background queue!',
    );
  }

  @Post('send-summary')
  async sendSummary(@Body('organizationId') organizationId: string) {
    console.info(
      `[NotificationsController] Received send-summary trigger for organizationId: ${organizationId}`,
    );
    const orgId = organizationId || 'default-org';
    await this.notificationsService.triggerOrganizationSummary(orgId);
    return { status: 'summary_triggered', organizationId: orgId };
  }

  @Post('blocker-alert')
  async blockerAlert(
    @Body('taskId') taskId: string,
    @Body('managerPhone') managerPhone: string,
    @Body('employeeName') employeeName: string,
    @Body('reason') reason: string,
  ) {
    console.info(`[NotificationsController] Received blocker-alert trigger for task ${taskId}`);
    await this.notificationsService.sendBlockerAlert(taskId, managerPhone, employeeName, reason);
    return { status: 'blocker_alert_sent', taskId };
  }

  @Post('deadline-reminder')
  async deadlineReminder(
    @Body('taskId') taskId: string,
    @Body('employeePhone') employeePhone: string,
    @Body('taskTitle') taskTitle: string,
    @Body('hoursRemaining') hoursRemaining: number,
  ) {
    console.info(`[NotificationsController] Received deadline-reminder trigger for task ${taskId}`);
    await this.notificationsService.sendDeadlineReminder(
      taskId,
      employeePhone,
      taskTitle,
      hoursRemaining,
    );
    return { status: 'deadline_reminder_sent', taskId };
  }

  @Post('task-assigned')
  async taskAssigned(
    @Body('taskId') taskId: string,
    @Body('employeePhone') employeePhone: string,
    @Body('taskTitle') taskTitle: string,
    @Body('dueDate') dueDate: string,
  ) {
    console.info(`[NotificationsController] Received task-assigned trigger for task ${taskId}`);
    await this.notificationsService.sendTaskAssignedAlert(
      taskId,
      employeePhone,
      taskTitle,
      dueDate,
    );
    return { status: 'task_assignment_alert_sent', taskId };
  }
}
