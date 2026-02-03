import { NcNetworkSchema } from '@codaco/shared-consts';
import { createId } from '@paralleldrive/cuid2';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addEvent } from '~/actions/activityFeed';
import { prisma } from '~/lib/db';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

const RequestSchema = z.object({
  protocolId: z.string(),
  data: z.object({
    network: NcNetworkSchema,
    currentStep: z.number(),
    stageMetadata: StageMetadataSchema.optional(),
    lastUpdated: z.string(),
  }),
  participantIdentifier: z.string().optional(),
});

const routeHandler = async (request: NextRequest) => {
  try {
    await requireApiAuth();

    const rawPayload: unknown = await request.json();
    const validatedRequest = RequestSchema.safeParse(rawPayload);

    if (!validatedRequest.success) {
      return NextResponse.json(
        { error: validatedRequest.error },
        { status: 400 },
      );
    }

    const { protocolId, data, participantIdentifier } = validatedRequest.data;

    const participantStatement = participantIdentifier
      ? {
          connectOrCreate: {
            create: {
              identifier: participantIdentifier,
            },
            where: {
              identifier: participantIdentifier,
            },
          },
        }
      : {
          create: {
            identifier: `p-${createId()}`,
            label: 'Anonymous Participant',
          },
        };

    const createdInterview = await prisma.interview.create({
      select: {
        participant: true,
        id: true,
      },
      data: {
        network: data.network,
        currentStep: data.currentStep,
        stageMetadata: data.stageMetadata ?? undefined,
        lastUpdated: new Date(data.lastUpdated),
        participant: participantStatement,
        protocol: {
          connect: {
            id: protocolId,
          },
        },
      },
    });

    void addEvent(
      'Interview Started',
      `Participant "${
        createdInterview.participant.label ??
        createdInterview.participant.identifier
      }" started an offline interview`,
    );

    return NextResponse.json({ serverId: createdInterview.id });
  } catch (e) {
    const error = ensureError(e);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export { routeHandler as POST };
