import NoSSRWrapper from '~/utils/NoSSRWrapper';
import InterviewShell from '../_components/InterviewShell';
import { api } from '~/trpc/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  const appSettings = await api.appSettings.get.query();
  const interview = await api.interview.get.byId.query({ id: interviewId });

  // if limitInterviews is enabled
  // Check cookies for interview already completed for this user for this protocol
  // and redirect to finished page
  if (
    appSettings?.limitInterviews &&
    cookies().get(interview?.protocol?.id ?? '')
  ) {
    redirect('/interview/finished');
  }

  // If the interview is finished, redirect to the finish page
  if (interview?.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <div className="flex h-[100vh] max-h-[100vh] flex-col bg-[--nc-background] text-[--nc-text]">
      <NoSSRWrapper>
        <InterviewShell interviewID={interviewId} />
      </NoSSRWrapper>
    </div>
  );
}
