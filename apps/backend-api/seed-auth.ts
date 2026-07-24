import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import * as path from 'path';

const env = dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenvExpand(env);
dotenv.config();
import { PrismaClient, Role } from '@useaxiom/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create / Upsert organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Mock Organization',
        whatsappBusinessId: '1234567890',
      },
    });
  }

  // Seeding Manager
  const manager = await prisma.user.upsert({
    where: { email: 'mockmanager@useaxiom.com' },
    update: {
      passwordHash,
      role: 'MANAGER',
      employeeId: 'EMP-001',
    },
    create: {
      email: 'mockmanager@useaxiom.com',
      passwordHash,
      name: 'Test Manager',
      phoneNumber: '+19998887777',
      role: 'MANAGER',
      employeeId: 'EMP-001',
      organizationId: org.id,
    },
  });

  // Seeding Employees matching frontend list
  const employees = [
    {
      email: 'sarah@useaxiom.com',
      name: 'Sarah Jenkins',
      phoneNumber: '+19998887777',
      employeeId: 'EMP-002',
      role: Role.EMPLOYEE,
      specialty: 'Backend',
    },
    {
      email: 'alex@useaxiom.com',
      name: 'Alex Rivers',
      phoneNumber: '+19998887778',
      employeeId: 'EMP-003',
      role: Role.EMPLOYEE,
      specialty: 'DevOps',
    },
    {
      email: 'dave@useaxiom.com',
      name: 'Dave Morris',
      phoneNumber: '+19998887779',
      employeeId: 'EMP-004',
      role: Role.EMPLOYEE,
      specialty: 'Frontend',
    },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        phoneNumber: emp.phoneNumber,
        employeeId: emp.employeeId,
        role: emp.role,
        specialty: emp.specialty,
      },
      create: {
        email: emp.email,
        name: emp.name,
        phoneNumber: emp.phoneNumber,
        employeeId: emp.employeeId,
        role: emp.role,
        specialty: emp.specialty,
        organizationId: org.id,
      },
    });
  }

  // Get current users from DB
  const dbSarah = await prisma.user.findUniqueOrThrow({ where: { email: 'sarah@useaxiom.com' } });
  const dbAlex = await prisma.user.findUniqueOrThrow({ where: { email: 'alex@useaxiom.com' } });
  const dbDave = await prisma.user.findUniqueOrThrow({ where: { email: 'dave@useaxiom.com' } });

  // 1. Seed Website Redesign Project
  const projWebsite = await prisma.project.upsert({
    where: { id: 'd0b8f6ca-1de8-46ca-9540-defea938119b' }, // static UUID
    update: {
      name: 'Website Redesign',
      objective: 'Revamp the customer-facing website and build a new client portal.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
    create: {
      id: 'd0b8f6ca-1de8-46ca-9540-defea938119b',
      name: 'Website Redesign',
      objective: 'Revamp the customer-facing website and build a new client portal.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
  });

  // Project Members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projWebsite.id, userId: dbDave.id } },
    update: {},
    create: { projectId: projWebsite.id, userId: dbDave.id },
  });

  // Seed Website milestones
  const msDesign = await prisma.milestone.upsert({
    where: { id: 'a5556485-f29e-4ade-8391-7f2aa276c8c1' },
    update: { name: 'Design Phase', description: 'Figma mockups and responsive styles architecture.' },
    create: {
      id: 'a5556485-f29e-4ade-8391-7f2aa276c8c1',
      projectId: projWebsite.id,
      name: 'Design Phase',
      description: 'Figma mockups and responsive styles architecture.',
      targetDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  // Tasks in Website Redesign (12 tasks: 8 COMPLETED, 3 PENDING, 1 BLOCKED)
  const taskBlockedDave1 = await prisma.task.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000105' },
    update: {
      title: 'Dashboard Layout',
      description: 'Design and implement the main workspace view.',
      status: 'BLOCKED',
      milestoneId: msDesign.id,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000105',
      organizationId: org.id,
      projectId: projWebsite.id,
      milestoneId: msDesign.id,
      title: 'Dashboard Layout',
      description: 'Design and implement the main workspace view.',
      status: 'BLOCKED',
    },
  });
  await prisma.assignment.upsert({
    where: { taskId_userId: { taskId: taskBlockedDave1.id, userId: dbDave.id } },
    update: {},
    create: { taskId: taskBlockedDave1.id, userId: dbDave.id },
  });

  const websiteTasks = [
    { title: 'Setup Next.js site skeleton', status: 'COMPLETED' },
    { title: 'Brand style guide approval', status: 'COMPLETED' },
    { title: 'Create component library integration', status: 'COMPLETED' },
    { title: 'Deploy landing page v1', status: 'COMPLETED' },
    { title: 'Setup local development environment', status: 'COMPLETED' },
    { title: 'Database schema definition', status: 'COMPLETED' },
    { title: 'API base controller structure', status: 'COMPLETED' },
    { title: 'CI/CD pipeline test run', status: 'COMPLETED' },
    { title: 'Figma component specifications review', status: 'PENDING' },
    { title: 'API OAuth integration testing', status: 'PENDING' },
    { title: 'End-to-end Cypress workflows scaffolding', status: 'PENDING' },
  ];

  for (let i = 0; i < websiteTasks.length; i++) {
    const t = websiteTasks[i];
    const taskIdVal = 'b0000000-0000-0000-0000-' + String(100 + i).padStart(12, '0');
    const createdTask = await prisma.task.upsert({
      where: { id: taskIdVal },
      update: { title: t.title, status: t.status as any },
      create: {
        id: taskIdVal,
        organizationId: org.id,
        projectId: projWebsite.id,
        title: t.title,
        description: `Description for ${t.title}`,
        status: t.status as any,
      },
    });
    // Assign to Dave
    await prisma.assignment.upsert({
      where: { taskId_userId: { taskId: createdTask.id, userId: dbDave.id } },
      update: {},
      create: { taskId: createdTask.id, userId: dbDave.id },
    });
  }

  // 2. Seed AI Agent Deployment Phase 2 Project
  const projAI = await prisma.project.upsert({
    where: { id: 'd0b8f6ca-1de8-46ca-9540-defea938120b' },
    update: {
      name: 'AI Agent Deployment Phase 2',
      objective: 'Deploy orchestration and assignment agents.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
    create: {
      id: 'd0b8f6ca-1de8-46ca-9540-defea938120b',
      name: 'AI Agent Deployment Phase 2',
      objective: 'Deploy orchestration and assignment agents.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projAI.id, userId: dbDave.id } },
    update: {},
    create: { projectId: projAI.id, userId: dbDave.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projAI.id, userId: dbAlex.id } },
    update: {},
    create: { projectId: projAI.id, userId: dbAlex.id },
  });

  const taskBlockedDave2 = await prisma.task.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000108' },
    update: {
      title: 'Notification Queue',
      description: 'Build background queue processors for emails and SMS.',
      status: 'BLOCKED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000108',
      organizationId: org.id,
      projectId: projAI.id,
      title: 'Notification Queue',
      description: 'Build background queue processors for emails and SMS.',
      status: 'BLOCKED',
    },
  });
  await prisma.assignment.upsert({
    where: { taskId_userId: { taskId: taskBlockedDave2.id, userId: dbDave.id } },
    update: {},
    create: { taskId: taskBlockedDave2.id, userId: dbDave.id },
  });

  const taskBlockedAlex = await prisma.task.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000115' },
    update: {
      title: 'Redis cache configuration',
      description: 'Review blocked Redis queue configurations.',
      status: 'BLOCKED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000115',
      organizationId: org.id,
      projectId: projAI.id,
      title: 'Redis cache configuration',
      description: 'Review blocked Redis queue configurations.',
      status: 'BLOCKED',
    },
  });
  await prisma.assignment.upsert({
    where: { taskId_userId: { taskId: taskBlockedAlex.id, userId: dbAlex.id } },
    update: {},
    create: { taskId: taskBlockedAlex.id, userId: dbAlex.id },
  });

  // 3. Seed eCommerce backend project
  const projEcom = await prisma.project.upsert({
    where: { id: 'd0b8f6ca-1de8-46ca-9540-defea938130b' },
    update: {
      name: 'eCommerce backend',
      objective: 'Secure processing payment endpoints.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
    create: {
      id: 'd0b8f6ca-1de8-46ca-9540-defea938130b',
      name: 'eCommerce backend',
      objective: 'Secure processing payment endpoints.',
      status: 'ACTIVE',
      organizationId: org.id,
      managerId: manager.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projEcom.id, userId: dbSarah.id } },
    update: {},
    create: { projectId: projEcom.id, userId: dbSarah.id },
  });

  const taskBlockedSarah = await prisma.task.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000112' },
    update: {
      title: 'Payment Gateway Integration',
      description: 'Establish secure Stripe links and callbacks.',
      status: 'BLOCKED',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000112',
      organizationId: org.id,
      projectId: projEcom.id,
      title: 'Payment Gateway Integration',
      description: 'Establish secure Stripe links and callbacks.',
      status: 'BLOCKED',
    },
  });
  await prisma.assignment.upsert({
    where: { taskId_userId: { taskId: taskBlockedSarah.id, userId: dbSarah.id } },
    update: {},
    create: { taskId: taskBlockedSarah.id, userId: dbSarah.id },
  });

  console.log('Seeded test manager:', manager.email);
  console.log('Seeded test employees:', employees.map((e) => e.name).join(', '));
  console.log('Seeded projects: Website Redesign, AI Agent Deployment Phase 2, eCommerce backend');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
