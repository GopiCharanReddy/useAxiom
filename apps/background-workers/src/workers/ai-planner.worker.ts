import { Job } from 'bullmq';
import { AiOrchestrator } from '@useaxiom/ai-core';
import { getLlmProvider } from '@useaxiom/ai-providers';
import { prisma } from '@useaxiom/database';
import { InMemoryMemory } from '@useaxiom/ai-memory';

export async function plannerWorkerProcessor(job: Job) {
  const { projectId, objective, tenantId } = job.data;

  const provider = getLlmProvider();
  const memory = new InMemoryMemory(); // Note: could be RagMemory if configured
  const orchestrator = new AiOrchestrator({ provider, memory });

  const result = await orchestrator.generateDebatedPlan(objective);

  if (result.milestones) {
    for (const milestone of result.milestones) {
      for (const task of milestone.tasks) {
        await prisma.task.create({
          data: {
            title: task.name,
            description: task.description || '',
            projectId: projectId,
            organizationId: tenantId,
            status: 'PROPOSED',
          },
        });
      }
    }
  }
}
