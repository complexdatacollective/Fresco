import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';
import mockInterview from '~/utils/generateMockData/interview/interview';
import type { Participant } from '@prisma/client';

interface IParticipantData {
  identifier: string;
}

// Create multiple new participants from an array
export const POST = async (req: Request) => {
  try {
    const participantData: IParticipantData[] | any = await req.json();
    const interview = mockInterview();
    let existingParticipants: Participant[] = [];

    for (const item of participantData) {
      console.log('ITEM', item);

      const existingParticipant = await prisma.participant.findUnique({
        where: {
          identifier: item.identifier,
        },
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            identifier: item.identifier,
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
      } else {
        existingParticipants.push(existingParticipant);
      }
    }

    return NextResponse.json({
      msg: 'Participants created successfully',
      existingParticipants,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Something happened', error },
      { status: 500 },
    );
  }
};
