import { Worker, Job, Queue } from 'bullmq';
import { prisma } from '@useaxiom/database';
import { AiOrchestrator } from '@useaxiom/ai-core';
import { getLlmProvider } from '@useaxiom/ai-providers';
import { RagMemory } from '@useaxiom/ai-memory';

export const createReportingWorker = (connection: any, notificationQueue: Queue) => {
  const provider = getLlmProvider();
  const memory = new RagMemory(provider);
  const orchestrator = new AiOrchestrator({ provider, memory });
  const reportingAgent = orchestrator.getReporting();

  const worker = new Worker(
    'reporting_jobs',
    async (job: Job) => {
      console.log(`[Reporting Worker] Starting health check for active projects...`);

      try {
        // 1. Fetch active projects with their tasks
        const activeProjects = await prisma.project.findMany({
          where: { status: 'ACTIVE' },
          include: {
            manager: true,
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                estimatedHours: true,
              },
            },
          },
        });

        if (activeProjects.length === 0) {
          console.log(`[Reporting Worker] No active projects found. Skipping.`);
          return { success: true, processedCount: 0 };
        }

        console.log(`[Reporting Worker] Analyzing ${activeProjects.length} active projects...`);

        // 2. Analyze each project
        for (const project of activeProjects) {
          console.log(`[Reporting Worker] Assessing project: ${project.name} (${project.id})`);

          const tasksForAgent = project.tasks.map((t) => ({
            id: t.id,
            name: t.title,
            status: t.status,
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : 1,
          }));

          const report = await reportingAgent.run({
            projectId: project.id,
            tasks: tasksForAgent,
          });

          console.log(
            `[Reporting Worker] Project ${project.name} Risk Score: ${report.riskScore} (${report.riskLevel})`,
          );

          // 3. Update Project with health score
          await prisma.project.update({
            where: { id: project.id },
            data: {
              healthScore: report.riskScore,
              healthStatus: report.riskLevel,
              healthReasoning: report.reasoning,
              healthSuggestions: report.suggestedActionItems,
            },
          });

          // 4. Dispatch notification if risk is HIGH
          if (report.riskLevel === 'HIGH' || report.riskScore > 70) {
            console.log(
              `[Reporting Worker] High risk detected for ${project.name}, dispatching alert.`,
            );
            if (project.manager) {
              await notificationQueue.add('send-notification', {
                recipient: {
                  phone: project.manager.phoneNumber,
                  email: project.manager.email,
                  name: project.manager.name,
                },
                channels: ['EMAIL', 'WHATSAPP'],
                template: 'PROJECT_RISK_ALERT',
                variables: {
                  projectName: project.name,
                  riskScore: report.riskScore,
                  reasoning: report.reasoning,
                },
              });
            } else {
              console.warn(
                `[Reporting Worker] No manager assigned to project ${project.name} (${project.id}). Skipping alert dispatch.`,
              );
            }
          }
        }

        console.log(`[Reporting Worker] Health check complete.`);
        return { success: true, processedCount: activeProjects.length };
      } catch (error) {
        console.error(`[Reporting Worker] Error during health check:`, error);
        throw error;
      }
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Reporting Worker] Job ${job?.id} failed:`, err);
  });

  return worker;
};
