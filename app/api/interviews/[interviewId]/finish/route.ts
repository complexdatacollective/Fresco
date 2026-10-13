import { cookies } from 'next/headers';
import { after, NextResponse } from 'next/server';

import { ensureError } from '@codaco/shared-consts';
import { addEvent } from '~/lib/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { parseStoredInterviewSession } from '~/lib/db/storedInterviewSession';
import { captureException, flushPostHog } from '~/lib/posthog-server';

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

    // Only the sizes are recorded, so stored data that does not parse costs the
    // activity its counts and nothing else: finishing writes no network.
    const stored = parseStoredInterviewSession(updatedInterview);

    void addEvent(
      'Interview Completed',
      `Participant "${participantDisplay}" completed an interview`,
      {
        kind: 'interviewCompleted',
        values: { participant: participantDisplay },
      },
      stored.success
        ? {
            nodeCount: stored.data.network.nodes.length,
            edgeCount: stored.data.network.edges.length,
          }
        : undefined,
    );

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeRevalidateTag(['getInterviews', 'summaryStatistics', 'activityFeed']);

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = ensureError(e);

    after(async () => {
      await captureException(error, { context: 'interview.finish' });
      await flushPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to finish interview' },
      { status: 500 },
    );
  }
}
