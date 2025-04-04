import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import SuperJSON from 'superjson';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getAppSetting } from '~/queries/appSettings';
import {
  getInterviewById,
  type GetInterviewByIdQuery,
} from '~/queries/interviews';
import { getServerSession } from '~/utils/auth';
import InterviewShell from '../_components/InterviewShell';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  const rawInterview = await getInterviewById(interviewId);

  // If the interview is not found, redirect to the 404 page
  if (!rawInterview) {
    notFound();
  }

  const interview =
    SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(rawInterview);
  const session = await getServerSession();

  // if limitInterviews is enabled
  // Check cookies for interview already completed for this user for this protocol
  // and redirect to finished page
  const limitInterviews = await getAppSetting('limitInterviews');

  if (limitInterviews && cookies().get(interview.protocol.id)) {
    redirect('/interview/finished');
  }

  // If the interview is finished, redirect to the finish page, unless we are
  // logged in as an admin
  if (!session && interview?.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <>
      {session && <FeedbackBanner />}
      <InterviewShell rawPayload={rawInterview} />
    </>
  );
}
