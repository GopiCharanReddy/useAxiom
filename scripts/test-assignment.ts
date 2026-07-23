import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const assignmentQueue = new Queue('assignment_jobs', { connection: redisConnection as any });

async function main() {
  console.log('Seeding database for Assignment Agent test...');

  // 1. Ensure Organization
  let org = await prisma.organization.findFirst({ where: { name: 'Axiom Test Org' } });
  if (!org) {
    org = await prisma.organization.create({ data: { name: 'Axiom Test Org' } });
  }

  // 2. Ensure Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      organizationId: org.id,
      role: 'MANAGER',
      name: 'Test Manager',
      email: 'manager@test.com',
      phoneNumber: '+19998880000',
    },
  });

  // 3. Create 2 Employees with different workloads
  const employee1 = await prisma.user.upsert({
    where: { email: 'emp1@test.com' },
    update: {},
    create: {
      organizationId: org.id,
      role: 'EMPLOYEE',
      name: 'Alice Frontend',
      email: 'emp1@test.com',
      phoneNumber: '+19998881111',
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'emp2@test.com' },
    update: {},
    create: {
      organizationId: org.id,
      role: 'EMPLOYEE',
      name: 'Bob Backend',
      email: 'emp2@test.com',
      phoneNumber: '+19998882222',
    },
  });

  // 4. Create a Project
  const project = await prisma.project.create({
    data: {
      name: 'AI Agent Deployment Phase 2',
      objective: 'Deploy assignment logic',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
  });

  // 5. Create 3 PENDING tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design database schema for assignment queue',
        description: 'Need Postgres tables updated for BullMQ status.',
        projectId: project.id,
        organizationId: org.id,
        status: 'PENDING',
        estimatedHours: 4,
      },
      {
        title: 'Implement React UI for tasks',
        description: 'Build Next.js components for assignments.',
        projectId: project.id,
        organizationId: org.id,
        status: 'PENDING',
        estimatedHours: 5,
      },
      {
        title: 'Add Redis cache layer',
        description: 'Setup IORedis connection in backend.',
        projectId: project.id,
        organizationId: org.id,
        status: 'PENDING',
        estimatedHours: 3,
      },
    ],
  });

  console.log(`Created Project: ${project.id}`);
  console.log('Enqueueing assignment_jobs...');

  await assignmentQueue.add('assign-tasks', {
    projectId: project.id,
    tenantId: org.id,
  });

  console.log('Assignment job queued successfully!');
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
