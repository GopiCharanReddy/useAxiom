import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private notificationsQueue: Queue) {}

  async sendTestNotification(userId: string, message: string) {
    const job = await this.notificationsQueue.add('test-notification', {
      userId,
      message,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      jobId: job.id,
      message: 'Notification job queued successfully'
    };
  }
}
