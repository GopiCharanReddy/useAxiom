import { Job } from 'bullmq';
import { ConversationAgent } from '@useaxiom/ai-core';
import { getLlmProvider } from '@useaxiom/ai-providers';
import { InMemoryMemory } from '@useaxiom/ai-memory';

export async function whatsappWorkerProcessor(job: Job) {
  const { message, from, tenantId } = job.data;

  const provider = getLlmProvider();
  const memory = new InMemoryMemory();
  const agent = new ConversationAgent({
    provider,
    memory,
    systemPrompt: 'You are a conversation agent.',
  });

  const result = await agent.run({ message, threadId: from });

  console.log('WhatsApp Agent Result:', result);
}
