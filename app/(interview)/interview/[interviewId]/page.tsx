import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import SuperJSON from 'superjson';
import { Spinner } from '~/lib/legacy-ui/components';
import { getAppSetting } from '~/queries/appSettings';
import {
  getInterviewById,
  type GetInterviewByIdQuery,
} from '~/queries/interviews';
import { getServerSession } from '~/utils/auth';
import InterviewShell from '../_components/InterviewShell';

export default function Page(props: {
  params: Promise<{ interviewId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </main>
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

  return (
    <>
      <InterviewShell rawPayload={rawInterview} />
    </>
  );
}
