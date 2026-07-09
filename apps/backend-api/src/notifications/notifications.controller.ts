import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  async testNotification(@Body() body: { userId: string, message: string }) {
    return this.notificationsService.sendTestNotification(
      body.userId || 'mock-user-123',
      body.message || 'Hello from the background queue!'
    );
  }
}
