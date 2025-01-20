import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getAppSetting } from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';
import { getBaseUrl } from '~/utils/getBaseUrl';
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

  const fetchInterview = await fetch(
    `${getBaseUrl()}/interview/${interviewId}/fetch`,
    {
      cache: 'no-store',
    },
  );

  const { result: interview } = await fetchInterview.json();

  const session = await getServerSession();

  // If the interview is not found, redirect to the 404 page
  if (!interview) {
    notFound();
  }

  // if limitInterviews is enabled
  // Check cookies for interview already completed for this user for this protocol
  // and redirect to finished page
  const limitInterviews = await getAppSetting('limitInterviews');

  if (limitInterviews && cookies().get(interview?.protocol?.id ?? '')) {
    redirect('/interview/finished');
  }

  // If the interview is finished, redirect to the finish page
  if (interview?.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <>
      {session && <FeedbackBanner />}
      <InterviewShell serverPayload={interview} />
    </>
  );
}
