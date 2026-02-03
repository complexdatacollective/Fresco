import { NcNetworkSchema } from '@codaco/shared-consts';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addEvent } from '~/actions/activityFeed';
import { prisma } from '~/lib/db';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

const RequestSchema = z.object({
  network: NcNetworkSchema,
  currentStep: z.number(),
  stageMetadata: StageMetadataSchema.optional(),
  lastUpdated: z.string(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

const routeHandler = async (request: NextRequest, { params }: RouteParams) => {
  try {
    await requireApiAuth();

    const { id } = await params;

    const rawPayload: unknown = await request.json();
    const validatedRequest = RequestSchema.safeParse(rawPayload);

    if (!validatedRequest.success) {
      return NextResponse.json(
        { error: validatedRequest.error },
        { status: 400 },
      );
    }

    const { network, currentStep, stageMetadata, lastUpdated } =
      validatedRequest.data;

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: {
        id: true,
        version: true,
        participant: {
          select: {
            identifier: true,
            label: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        network,
        currentStep,
        stageMetadata: stageMetadata ?? undefined,
        lastUpdated: new Date(lastUpdated),
        version: {
          increment: 1,
        },
      },
      select: {
        version: true,
      },
    });

    void addEvent(
      'Conflict Resolved',
      `Conflict resolved for participant "${
        interview.participant.label ?? interview.participant.identifier
      }" by keeping local changes`,
    );

    return NextResponse.json({ version: updatedInterview.version });
  } catch (e) {
    const error = ensureError(e);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export { routeHandler as POST };
