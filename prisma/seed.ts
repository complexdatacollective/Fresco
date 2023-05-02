import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password', 8)
  const user = await prisma.user.upsert({
    where: { email: 'test@networkcanvas.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@networkcanvas.com',
      password,
      role: 'ADMIN',

    },
  })
  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
