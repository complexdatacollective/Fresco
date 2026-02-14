import { NcNetworkSchema } from '@codaco/shared-consts';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { trackServerException } from '~/lib/analytics/trackServerException';
import { prisma } from '~/lib/db';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { ensureError } from '~/utils/ensureError';

/**
 * Handle post requests from the client to store the current interview state.
 */
const routeHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) => {
  const { interviewId } = await params;

  const rawPayload = await request.json();

  const Schema = z.object({
    id: z.string(),
    network: NcNetworkSchema,
    currentStep: z.number(),
    stageMetadata: StageMetadataSchema.optional(),
    lastUpdated: z.string(),
  });

  const validatedRequest = Schema.safeParse(rawPayload);

  if (!validatedRequest.success) {
    void trackServerException(validatedRequest.error, { interviewId });

    return NextResponse.json(
      {
        error: validatedRequest.error,
      },
      { status: 400 },
    );
  }

  const { network, currentStep, stageMetadata, lastUpdated } =
    validatedRequest.data;

  try {
    await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        network,
        currentStep,
        stageMetadata: stageMetadata ?? undefined,
        lastUpdated: new Date(lastUpdated),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = ensureError(e);

    void trackServerException(error, { interviewId });

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }
};

export { routeHandler as POST };
