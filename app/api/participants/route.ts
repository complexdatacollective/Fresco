import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';
import mockInterview from '~/utils/generateMockData/interview/interview';

interface IParticipantData {
  identifier: string;
}

// Create a new participant
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

// Get all participants
export const GET = async (req: Request) => {
  try {
    const participants = await prisma.participant.findMany();

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something happened', error },
      { status: 500 },
    );
  }
};
