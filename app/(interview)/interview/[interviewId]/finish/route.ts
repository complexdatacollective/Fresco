import { type NcNetwork } from '@codaco/shared-consts';
import { cookies } from 'next/headers';
import { after, NextResponse, type NextRequest } from 'next/server';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { ensureError } from '~/utils/ensureError';

const routeHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) => {
  const { interviewId } = await params;

  try {
    const updatedInterview = await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        finishTime: new Date(),
      },
      include: {
        participant: true,
      },
    });

    const { label, identifier } = updatedInterview.participant;
    const participantDisplay = label ? `${label} (${identifier})` : identifier;

    const network = JSON.parse(
      JSON.stringify(updatedInterview.network),
    ) as NcNetwork;

    void addEvent(
      'Interview Completed',
      `Participant "${participantDisplay}" completed an interview`,
      {
        nodeCount: network?.nodes?.length ?? 0,
        edgeCount: network?.edges?.length ?? 0,
      },
    );

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeRevalidateTag('getInterviews');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('activityFeed');

    return NextResponse.json({ error: null });
  } catch (e) {
    const error = ensureError(e);

    after(async () => {
      await captureException(error, { interviewId });
      await shutdownPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to finish interview' },
      { status: 500 },
    );
  }
};

export { routeHandler as POST };
