import { NextResponse } from 'next/server';
import { z } from 'zod';
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
      },
    });

    return NextResponse.json({
      msg: 'Participant created successfully',
      newParticipant,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something went wrong!', error },
      { status: 500 },
    );
  }
};

export const ParticipantValidation = z.array(
  z.object({
    id: z.string(),
    identifier: z.string(),
  }),
);

// Get all participants
export const GET = async (req: Request) => {
  try {
    const participants = await prisma.participant.findMany();
    const result = ParticipantValidation.parse(participants);

    return NextResponse.json({ participants: result });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something went wrong!', error },
      { status: 500 },
    );
  }
};
