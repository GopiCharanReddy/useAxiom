import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import type { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(
    @Body('message') message: string,
    @Body('threadId') threadId: string,
    @Req() req: Request,
  ) {
    // Optionally inject user context into the message or orchestrator if needed
    // const userId = (req.user as any).id;

    const orchestrator = this.aiService.getOrchestrator();

    // Using a default threadId if none is provided
    const conversationThread = threadId || 'default-thread';

    try {
      const response = await orchestrator.getConversation().run({
        threadId: conversationThread,
        message,
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
