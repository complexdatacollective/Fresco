import { hash } from 'bcrypt';
import { prisma } from "../src/server/db";

async function main() {
  const password = await hash('password', 8)

  await prisma.user.upsert({
    where: { email: 'admin@networkcanvas.com' },
    update: {},
    create: {
      name: 'Test Admin User',
      email: 'admin@networkcanvas.com',
      password,
      role: 'ADMIN',

    },
  })

  await prisma.user.upsert({
    where: { email: 'participant@networkcanvas.com' },
    update: {},
    create: {
      name: 'Test Participant User',
      email: 'participant@networkcanvas.com',
      password,
      role: 'PARTICIPANT',
    },
  })
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
