import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { after, connection } from 'next/server';
import { Suspense } from 'react';
import SuperJSON from 'superjson';
import { type ActivityType } from '~/app/dashboard/_components/ActivityFeed/types';
import Spinner from '~/components/Spinner';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureEvent, shutdownPostHog } from '~/lib/posthog-server';
import { getAppSetting } from '~/queries/appSettings';
import {
  getInterviewById,
  type GetInterviewByIdQuery,
} from '~/queries/interviews';
import { getServerSession } from '~/utils/auth';

const InterviewShell = dynamic(
  () => import('~/lib/interviewer/InterviewShell'),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);

export default function Page(props: {
  params: Promise<{ interviewId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <InterviewContent params={props.params} />
    </Suspense>
  );
}

async function InterviewContent({
  params: paramsPromise,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  await connection();
  const { interviewId } = await paramsPromise;

  if (!interviewId) {
    return 'No interview id found';
  }

  const rawInterview = await getInterviewById(interviewId);

  if (!rawInterview) {
    notFound();
  }

  const interview =
    SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(rawInterview);
  const session = await getServerSession();

  const limitInterviews = await getAppSetting('limitInterviews');

  if (limitInterviews && (await cookies()).get(interview.protocol.id)) {
    redirect('/interview/finished');
  }

  if (!session && interview?.finishTime) {
    redirect('/interview/finished');
  }

  after(async () => {
    try {
      const message = session
        ? `Interview "${interviewId}" was opened by user "${session.user.username}"`
        : `Interview "${interviewId}" was opened`;

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const recentEvent = await prisma.events.findFirst({
        where: {
          type: 'Interview Opened',
          message,
          timestamp: { gte: thirtyMinutesAgo },
        },
      });

      if (recentEvent) return;

      await prisma.events.create({
        data: {
          type: 'Interview Opened' satisfies ActivityType,
          message,
        },
      });

      safeRevalidateTag('activityFeed');

      await captureEvent('Interview Opened', { message });
      await shutdownPostHog();
    } catch {
      // Non-critical — don't block the interview
    }
  });

  return <InterviewShell rawPayload={rawInterview} />;
}
