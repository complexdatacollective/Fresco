import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { syncInterview } from '~/actions/interviews';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getAppSetting } from '~/queries/appSettings';
import { getInterviewById } from '~/queries/interviews';
import { getServerSession } from '~/utils/auth';
import InterviewShell from '../_components/InterviewShell';

export const dynamic = 'force-dynamic'; // Force dynamic rendering for this page

export default async function Page(
  props: {
    params: Promise<{ interviewId: string }>;
  }
) {
  const params = await props.params;
  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  const interview = await getInterviewById(interviewId);
  const session = await getServerSession();

  // If the interview is not found, redirect to the 404 page
  if (!interview) {
    notFound();
  }

  // if limitInterviews is enabled
  // Check cookies for interview already completed for this user for this protocol
  // and redirect to finished page
  const limitInterviews = await getAppSetting('limitInterviews');

  if (limitInterviews && (await cookies()).get(interview?.protocol?.id ?? '')) {
    redirect('/interview/finished');
  }

  // If the interview is finished, redirect to the finish page
  if (!session && interview?.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <>
      {session && <FeedbackBanner />}
      <InterviewShell interview={interview} syncInterview={syncInterview} />
    </>
  );
}
