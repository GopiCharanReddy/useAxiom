import { Injectable, OnModuleInit } from '@nestjs/common';
import { AiOrchestrator } from '@useaxiom/ai-core';
import { OpenAiProvider, MockLlmProvider, GeminiProvider } from '@useaxiom/ai-providers';
import { InMemoryMemory } from '@useaxiom/ai-memory';

@Injectable()
export class AiService implements OnModuleInit {
  private orchestrator!: AiOrchestrator;

  onModuleInit() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let provider;
    if (geminiKey) {
      provider = new GeminiProvider(geminiKey);
    } else if (openaiKey) {
      provider = new OpenAiProvider(openaiKey);
    } else {
      provider = new MockLlmProvider();
    }

    const memory = new InMemoryMemory();

    this.orchestrator = new AiOrchestrator({ provider, memory });
    console.log(`[useAxiom] AI Service Initialized with "${provider.name}" provider.`);
  }

  getOrchestrator(): AiOrchestrator {
    return this.orchestrator;
  }
}
