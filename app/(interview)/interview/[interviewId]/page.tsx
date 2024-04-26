/* eslint-disable local-rules/require-data-mapper */
import InterviewShell from '../_components/InterviewShell';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '~/utils/db';
import { unstable_noStore } from 'next/cache';
import { getLimitInterviewsStatus } from '~/queries/appSettings';
import { Suspense } from 'react';
import { syncInterview } from '~/actions/interviews';
import { getInterviewById } from '~/queries/interviews';

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  const interview = await getInterviewById(interviewId);

  // If the interview is not found, redirect to the 404 page
  if (!interview) {
    notFound();
  }

  // if limitInterviews is enabled
  // Check cookies for interview already completed for this user for this protocol
  // and redirect to finished page
  const limitInterviews = await getLimitInterviewsStatus();

  if (limitInterviews && cookies().get(interview?.protocol?.id ?? '')) {
    redirect('/interview/finished');
  }

  // If the interview is finished, redirect to the finish page
  if (interview?.finishTime) {
    redirect('/interview/finished');
  }

  return (
    <Suspense fallback="Loading interview shell...">
      <InterviewShell interview={interview} syncInterview={syncInterview} />
    </Suspense>
  );
}
