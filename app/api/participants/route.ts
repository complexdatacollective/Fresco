import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';
import mockInterview from '~/utils/generateMockData/interview/interview';

interface IParticipantData {
  identifier: string;
}

export const POST = async (req: Request) => {
  try {
    const participantData: IParticipantData | any = await req.json();
    const interview = mockInterview();

    const newParticipant = await prisma.participant.create({
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

    return NextResponse.json({
      msg: 'Participant created successfully',
      newParticipant,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something happened', error },
      { status: 500 },
    );
  }
};
