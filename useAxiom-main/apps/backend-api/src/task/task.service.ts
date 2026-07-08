import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {
  async approveTask(id: string, overrideData?: { assignee_id_override?: string; estimated_hours_override?: number }) {
    return {
      message: 'Task approved successfully',
      taskId: id,
      ...overrideData,
      approvedAt: new Date().toISOString(),
    };
  }
}
