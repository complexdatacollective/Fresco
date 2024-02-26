import NoSSRWrapper from '~/utils/NoSSRWrapper';
import InterviewShell from '../_components/InterviewShell';
import { api } from '~/trpc/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '~/utils/db';

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
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      protocol: {
        include: { assets: true },
      },
    },
  });

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
