import { Injectable, OnModuleInit } from '@nestjs/common';
import { AiOrchestrator } from '@useaxiom/ai-core';
import {
  OpenAiProvider,
  MockLlmProvider,
  GeminiProvider,
  getLlmProvider,
} from '@useaxiom/ai-providers';
import { InMemoryMemory } from '@useaxiom/ai-memory';

@Injectable()
export class AiService implements OnModuleInit {
  private orchestrator!: AiOrchestrator;

  onModuleInit() {
    const provider = getLlmProvider();
    const memory = new InMemoryMemory();

    this.orchestrator = new AiOrchestrator({ provider, memory });
    console.log(`[useAxiom] AI Service Initialized with "${provider.name}" provider.`);
  }

  getOrchestrator(): AiOrchestrator {
    return this.orchestrator;
  }
}
