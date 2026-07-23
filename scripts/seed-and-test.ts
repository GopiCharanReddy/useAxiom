import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for End-to-End AI test...');
  
  // 1. Create Organization
  const org = await prisma.organization.findFirst() || await prisma.organization.create({
    data: { name: 'Axiom Test Org' }
  });

  // 2. Create User (Employee)
  const employeeWaId = '+19998887777';
  const employee = await prisma.user.upsert({
    where: { email: 'employee@test.com' },
    update: {},
    create: {
      organizationId: org.id,
      role: 'EMPLOYEE',
      name: 'Test Employee',
      email: 'employee@test.com',
      phoneNumber: employeeWaId
    }
  });

  // 3. Create Project & Task
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'AI Integration Test Project',
      objective: 'Ensure the AI worker works end-to-end',
      status: 'ACTIVE'
    }
  });

  const task = await prisma.task.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      title: 'Deploy the new AI background worker',
      description: 'You need to push the code to staging and verify the logs.',
      status: 'IN_PROGRESS'
    }
  });

  // 4. Assign Task to Employee
  await prisma.assignment.create({
    data: {
      taskId: task.id,
      userId: employee.id
    }
  });

  console.log(`Database seeded successfully!`);
  console.log(`Task Title: ${task.title}`);
  console.log(`Assigned To WaID: ${employeeWaId}`);

  // 5. Fire webhook request to localhost:8001
  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: 'Test Employee' } }],
          messages: [{
            from: employeeWaId,
            text: { body: "I'm totally stuck because my deployment credentials to staging are getting rejected. Can you help?" }
          }]
        }
      }]
    }]
  };

  console.log('\nSending webhook POST request to http://localhost:8001/api/v1/webhooks/whatsapp...');
  
  try {
    const res = await fetch('http://localhost:8001/api/v1/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // 'x-hub-signature-256' normally required, but we will see if the controller accepts it without (it logs a warning but proceeds in the code)
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`Webhook HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log(`Webhook Response:`, data);
  } catch (err) {
    console.error('Failed to send webhook request:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
