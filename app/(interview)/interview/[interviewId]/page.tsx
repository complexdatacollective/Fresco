import NoSSRWrapper from '~/utils/NoSSRWrapper';
import InterviewShell from '../_components/InterviewShell';
import { api } from '~/trpc/server';
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

  // check if interview is finished
  const interview = await api.interview.get.byId.query({ id: interviewId });
  if (!interview) {
    return 'Interview not found';
  }

  if (interview.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <div className="flex h-[100vh] max-h-[100vh] flex-col bg-[var(--nc-background)] text-[var(--nc-text)]">
      <NoSSRWrapper>
        <InterviewShell interviewID={interviewId} />
      </NoSSRWrapper>
    </div>
  );
}
