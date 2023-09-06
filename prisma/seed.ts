/* eslint-disable local-rules/require-data-mapper */
import { hash } from 'bcrypt';
import { prisma } from '~/utils/db';
import protocol from '~/lib/development-protocol/protocol.json' assert { type: 'json' };
import mockParticipant from '~/utils/generateMockData/participant';
import mockInterview from '~/utils/generateMockData/interview/interview';

const hashPassword = async (password: string) => await hash(password, 12);

async function main() {
  // Clear out existing data
  await prisma.interview.deleteMany({});
  await prisma.protocol.deleteMany({});
  await prisma.user.deleteMany({});

  // Users
  await prisma.user.create({
    data: {
      email: 'admin@networkcanvas.com',
      name: 'Admin',
      password: await hashPassword('admin'),
    },
  });

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
    },
  });

  for (let i = 0; i < 20; i++) {
    const participantData = mockParticipant();
    const interview = mockInterview();

    await prisma.participant.create({
      data: {
        identifier: participantData.identifier,
        interviews: {
          create: {
            startTime: interview.startTime,
            network: '',
            protocol: {
              connect: {
                hash: 'development-protocol',
              },
            },
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
