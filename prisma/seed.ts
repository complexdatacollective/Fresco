import { hash } from 'bcrypt';
import { prisma } from "~/utils/db"

const hashPassword = async (password: string) => await hash(password, 12);

async function main() {
  // Clear out existing data
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});

  // Roles
  await prisma.role.create({
    data: {
      name: 'ADMIN',
    },
  })

  await prisma.role.create({
    data: {
      name: 'PARTICIPANT',
    },
  })

  // Users
  await prisma.user.create({
    data: {
      email: 'admin@networkcanvas.com',
      name: 'Admin',
      password: await hashPassword('admin'),
      roles: {
        connect: {
          name: 'ADMIN',
        },
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'participant@networkcanvas.com',
      name: 'Participant',
      password: await hashPassword('participant'),
      roles: {
        connect: {
          name: 'PARTICIPANT',
        },
      },
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
