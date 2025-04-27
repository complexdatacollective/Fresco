import { NcNetworkSchema } from '@codaco/shared-consts';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { safeRevalidateTag } from '~/lib/cache';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';

/**
 * Handle post requests from the client to store the current interview state.
 */
const routeHandler = async (
  request: NextRequest,
  { params }: { params: { interviewId: string } },
) => {
  const interviewId = params.interviewId;

  const rawRequest = await request.json();

  const Schema = z.object({
    id: z.string(),
    network: NcNetworkSchema,
    currentStep: z.number(),
    stageMetadata: StageMetadataSchema.optional(),
    lastUpdated: z.string(),
  });

  const validatedRequest = Schema.safeParse(rawRequest);

  if (!validatedRequest.success) {
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

    safeRevalidateTag(`getInterviewById-${interviewId}`);

    // eslint-disable-next-line no-console
    console.log(`🚀 Interview synced with server! (${interviewId})`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = ensureError(error).message;
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
};

export { routeHandler as POST };
