import { cookies } from 'next/headers';
import { after, NextResponse } from 'next/server';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { ensureError } from '~/utils/ensureError';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  const { interviewId } = await params;

  try {
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: { finishTime: new Date() },
      include: { participant: true },
    });

    const { label, identifier } = updatedInterview.participant;
    const participantDisplay = label ? `${label} (${identifier})` : identifier;

    const network = updatedInterview.network;

    void addEvent(
      'Interview Completed',
      `Participant "${participantDisplay}" completed an interview`,
      {
        nodeCount: network?.nodes?.length ?? 0,
        edgeCount: network?.edges?.length ?? 0,
      },
    );

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeRevalidateTag(['getInterviews', 'summaryStatistics', 'activityFeed']);

    return NextResponse.json({ success: true });
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
}
