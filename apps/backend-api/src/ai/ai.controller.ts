import { Controller, Post, Body, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process AI chat request',
      };
    }
  }
}
