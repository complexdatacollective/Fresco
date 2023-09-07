import { hash } from 'bcrypt';
import { prisma } from '~/utils/db';
import protocol from '~/lib/development-protocol/protocol.json' assert { type: 'json' };
import mockParticipant from '~/utils/generateMockData/participant';
import mockProtocol from '~/utils/generateMockData/protocol/protocol';
import mockInterview from '~/utils/generateMockData/interview/interview';

const hashPassword = async (password: string) => await hash(password, 12);

async function main() {
  // Clear out existing data
  await prisma.interview.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.protocol.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  // Roles
  await prisma.role.create({
    data: {
      name: 'ADMIN',
    },
  });

  await prisma.role.create({
    data: {
      name: 'PARTICIPANT',
    },
  });

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
  });

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
  });

  for (let i = 0; i < 20; i++) {
    const participantData = mockParticipant();
    await prisma.user.create({
      data: {
        ...participantData,
        roles: {
          connect: {
            name: 'PARTICIPANT',
          },
        },
      },
    });
  }

  // Protocols
  await prisma.protocol.create({
    data: {
      name: 'Development Protocol',
      hash: 'development-protocol',
      schemaVersion: protocol.schemaVersion,
      description: protocol.description,
      assetPath: 'assets/path',
      lastModified: protocol.lastModified,
      stages: JSON.stringify(protocol.stages),
      codebook: JSON.stringify(protocol.codebook),
      owner: {
        connect: {
          email: 'admin@networkcanvas.com',
        },
      },
    },
  });

  for (let i = 0; i < 4; i++) {
    const protocolData = mockProtocol();
    await prisma.protocol.create({
      data: {
        ...protocolData,
        owner: {
          connect: {
            email: 'admin@networkcanvas.com',
          },
        },
      },
    });
  }

  // Interviews

  for (let i = 0; i < 100; i++) {
    const interviewData = mockInterview();
    await prisma.interview.create({
      data: {
        ...interviewData,
        protocol: {
          connect: {
            hash: 'development-protocol',
          },
        },
        user: {
          connect: {
            email: 'participant@networkcanvas.com',
          },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
