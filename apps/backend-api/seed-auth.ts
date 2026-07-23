import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
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

  console.log('Seeded test manager:', manager.email);
  console.log('Seeded test employees:', employees.map((e) => e.name).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
