import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveTask(
    @Param('id') id: string,
    @Body() overrideData?: { assignee_id_override?: string; estimated_hours_override?: number },
  ) {
    return this.taskService.approveTask(id, overrideData);
  }
}
