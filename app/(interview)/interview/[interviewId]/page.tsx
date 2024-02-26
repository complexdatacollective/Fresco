/* eslint-disable local-rules/require-data-mapper */
import InterviewShell from '../_components/InterviewShell';
import { api } from '~/trpc/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '~/utils/db';
import { unstable_noStore } from 'next/cache';

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  unstable_noStore();

  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  const appSettings = await api.appSettings.get.query();

  /**
   * Fetch the interview using prisma directly here, because using tRPC is
   * heavily catched, and we always want to fetch the latest data.
   */
  const interview = await prisma.interview.findUnique({
    where: {
      id: interviewId,
    },
    include: {
      protocol: {
        include: {
          assets: true,
        },
      },
    },
  });

  // If the interview is not found, redirect to the 404 page
  if (!interview) {
    redirect('/404');
  }

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

  return <InterviewShell interview={interview} />;
}
