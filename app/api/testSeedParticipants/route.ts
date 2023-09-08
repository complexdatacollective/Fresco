import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';
import mockInterview from '~/utils/generateMockData/interview/interview';
import mockParticipant from '~/utils/generateMockData/participant';
import protocol from '~/lib/development-protocol/protocol.json' assert { type: 'json' };

export const POST = async (req: Request) => {
  try {
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

    return NextResponse.json({ msg: 'Participants created successfully' });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something happened', error },
      { status: 500 },
    );
  }
};
