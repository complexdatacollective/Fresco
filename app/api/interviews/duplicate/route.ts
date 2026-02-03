import { NcNetworkSchema } from '@codaco/shared-consts';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addEvent } from '~/actions/activityFeed';
import { prisma } from '~/lib/db';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

const RequestSchema = z.object({
  interviewId: z.string(),
  data: z.object({
    network: NcNetworkSchema,
    currentStep: z.number(),
    stageMetadata: StageMetadataSchema.optional(),
    lastUpdated: z.string(),
  }),
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

    const { interviewId, data } = validatedRequest.data;

    const originalInterview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        protocolId: true,
        participantId: true,
        participant: {
          select: {
            identifier: true,
            label: true,
          },
        },
      },
    });

    if (!originalInterview) {
      return NextResponse.json(
        { error: 'Original interview not found' },
        { status: 404 },
      );
    }

    const duplicateInterview = await prisma.interview.create({
      data: {
        network: data.network,
        currentStep: data.currentStep,
        stageMetadata: data.stageMetadata ?? undefined,
        lastUpdated: new Date(data.lastUpdated),
        protocol: {
          connect: {
            id: originalInterview.protocolId,
          },
        },
        participant: {
          connect: {
            id: originalInterview.participantId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    void addEvent(
      'Conflict Resolved',
      `Conflict resolved for participant "${
        originalInterview.participant.label ??
        originalInterview.participant.identifier
      }" by keeping both versions`,
    );

    return NextResponse.json({ interviewId: duplicateInterview.id });
  } catch (e) {
    const error = ensureError(e);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export { routeHandler as POST };
