import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';
import mockInterview from '~/utils/generateMockData/interview/interview';

interface IParticipantData {
  identifier: string;
}

// Create multiple new participants from an array
export const POST = async (req: Request) => {
  try {
    const participantData: IParticipantData[] | any = await req.json();
    const interview = mockInterview();

    const existingParticipants = await prisma.participant.findMany({
      where: {
        identifier: {
          in: participantData.map((p: IParticipantData) => p.identifier),
        },
      },
    });

    const createdParticipants = await prisma.participant.createMany({
      data: participantData,
      skipDuplicates: true,
    });

    return NextResponse.json({
      msg: 'Participants created successfully',
      existingParticipants,
      createdParticipants,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something went wrong!', error },
      { status: 500 },
    );
  }
};
