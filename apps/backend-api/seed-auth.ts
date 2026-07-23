import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
import { PrismaClient, Role } from '@useaxiom/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: {
      email: "mockmanager@useaxiom.com"
    },
    update: {
      passwordHash: await bcrypt.hash('password123', 10),
      role: "MANAGER"
    },
    create: {
      email: "mockmanager@useaxiom.com",
      passwordHash: await bcrypt.hash('password123', 10),
      name: "Test Manager",
      phoneNumber: "+19998887777",
      role: "MANAGER",
      organization: {
        create: {
          name: "Mock Organization",
          whatsappBusinessId: "1234567890"
        }
      }
    }
  });

  console.log('Seeded test manager:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
