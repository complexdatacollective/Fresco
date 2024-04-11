/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import protocol from '~/lib/development-protocol/protocol.json' with { type: 'json' };
import mockParticipant from '~/utils/generateMockData/participant';
import mockInterview from '~/utils/generateMockData/interview/interview';
import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18
import { generateLuciaPasswordHash } from 'lucia/utils';
import { createKeyId } from 'lucia';

async function main() {
  // Clear out existing data. These two cascade to the other models
  await prisma.user.deleteMany({});
  await prisma.protocol.deleteMany({});

  // Users
  await prisma.user.create({
    data: {
      username: 'admin',
      key: {
        create: {
          id: createKeyId('username', 'admin'),
          hashed_password: await generateLuciaPasswordHash('Administrator1!'),
        },
      },
    },
  });

  // Protocols
  await prisma.protocol.create({
    data: {
      name: 'Development Protocol',
      hash: 'development-protocol',
      schemaVersion: protocol.schemaVersion,
      description: protocol.description,
      lastModified: protocol.lastModified,
      stages: protocol.stages,
      codebook: protocol.codebook,
    },
  });

  for (let i = 0; i < 100; i++) {
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
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
