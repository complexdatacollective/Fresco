import { hash } from 'bcrypt';
import { prisma } from "~/utils/db"
import protocol from '~/lib/development-protocol/protocol.json' assert { type: "json" };

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
      protocols: {
        create: [{
          name: 'Test Protocol',
          hash: 'test-protocol',
          schemaVersion: '7',
          description: 'This is a test protocol',
          assetPath: 'assets/path',
          importedAt: '2023-05-09T16:35:55Z',
          lastModified: '2023-05-09T16:35:55Z',
          data: JSON.stringify(protocol.stages),
          interviews: {
            //create: [{
            //id: '1',
            //name: 'Test Interview',
            // startTime: '2023-05-09T16:35:55Z',
            //lastUpdated: '2023-05-09T16:35:55Z',
            //network: 'network',
            //}],
          },
        }]
      }
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
