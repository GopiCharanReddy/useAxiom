import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    include: { organization: true }
  });
  console.log('--- ALL DB USERS ---');
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email}) | Role: ${u.role} | OrgId: ${u.organizationId} | OrgName: ${u.organization?.name}`);
  }

  const projects = await prisma.project.findMany({
    include: { organization: true }
  });
  console.log('\n--- ALL DB PROJECTS ---');
  for (const p of projects) {
    console.log(`Project: ${p.name} (${p.id}) | OrgId: ${p.organizationId} | OrgName: ${p.organization?.name} | DeletedAt: ${p.deletedAt}`);
  }
}

main();
