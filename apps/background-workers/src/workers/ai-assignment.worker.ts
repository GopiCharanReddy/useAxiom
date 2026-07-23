import { Worker, Job, Queue } from 'bullmq';
import { prisma } from '@useaxiom/database';
import { AiOrchestrator } from '@useaxiom/ai-core';
import { getLlmProvider } from '@useaxiom/ai-providers';
import { RagMemory } from '@useaxiom/ai-memory';

export function createAssignmentWorker(redisConnection: any, outgoingQueue: Queue) {
  console.info('[AssignmentWorker] Starting AI Assignment worker...');

  const provider = getLlmProvider();
  const memory = new RagMemory(provider);
  const orchestrator = new AiOrchestrator({ provider, memory });

  const worker = new Worker(
    'assignment_jobs',
    async (job: Job) => {
      console.info(`[AssignmentWorker] Processing job ${job.id} for project ${job.data.projectId}`);

      const { projectId, tenantId } = job.data;
      if (!projectId || !tenantId) {
        throw new Error('projectId and tenantId are required');
      }

      // Fetch the pending tasks for the project
      const projectTasks = await prisma.task.findMany({
        where: {
          projectId,
          organizationId: tenantId,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (projectTasks.length === 0) {
        console.info(`[AssignmentWorker] No pending tasks found for project ${projectId}.`);
        return { status: 'no_tasks_to_assign' };
      }

      // Fetch the eligible team members
      const users = await prisma.user.findMany({
        where: {
          organizationId: tenantId,
          role: {
            not: 'ADMIN',
          },
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              assignments: {
                where: {
                  task: {
                    status: {
                      in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'],
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (users.length === 0) {
        console.warn(`[AssignmentWorker] No eligible team members found in org ${tenantId}.`);
        return { status: 'no_eligible_users' };
      }

      const tasksInput = projectTasks.map((t) => ({
        id: t.id,
        name: t.title,
        requiredSkills: [], // Could be expanded later if we add a skills schema
      }));

      const teamInput = users.map((u) => ({
        id: u.id,
        name: u.name,
        skills: [u.role], // Use role as a primary skill for now
        workload: u._count.assignments,
      }));

      console.info(
        `[AssignmentWorker] Running AssignmentAgent for ${projectTasks.length} tasks and ${users.length} team members.`,
      );

      const result = await orchestrator.getAssigner().run({
        tasks: tasksInput,
        team: teamInput,
      });

      // Save assignments to database
      for (const assignment of result.assignments) {
        console.info(
          `[AssignmentWorker] Assigning Task ${assignment.taskId} to User ${assignment.assigneeId}`,
        );
        await prisma.assignment.upsert({
          where: {
            taskId_userId: {
              taskId: assignment.taskId,
              userId: assignment.assigneeId,
            },
          },
          update: {},
          create: {
            taskId: assignment.taskId,
            userId: assignment.assigneeId,
          },
        });

        const assignedUser = users.find((u) => u.id === assignment.assigneeId);
        const task = projectTasks.find((t) => t.id === assignment.taskId);

        if (assignedUser && assignedUser.phoneNumber && task) {
          // Notify the user via WhatsApp
          await outgoingQueue.add('send_message', {
            to: assignedUser.phoneNumber,
            content: `Hi ${assignedUser.name}, you have been assigned a new task: "${task.title}". \n\nReasoning: ${assignment.rationale}`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      console.info(`[AssignmentWorker] Completed AI assignment for project ${projectId}.`);
      return { status: 'completed', assignments: result.assignments.length };
    },
    { connection: redisConnection },
  );

  worker.on('completed', (job) => console.log(`[AssignmentWorker] Job ${job.id} completed.`));
  worker.on('failed', (job, err) =>
    console.error(`[AssignmentWorker] Job ${job?.id} failed with error:`, err),
  );

  return worker;
}
