import { redirect } from 'next/navigation';
import { NetworkProvider } from '~/contexts/NetworkProvider';
import Stage from '~/app/(interview)/interview/_components/Stage';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';
import InterviewNavigation from '~/app/(interview)/interview/_components/InterviewNavigation';
import type { NcNetwork, Stage as StageType } from '~/lib/shared-consts';
import Link from 'next/link';
import { z } from 'zod';
import { safeLoader } from '~/lib/data-mapper/safeLoader';

const InterviewValidation = z.object({
  id: z.string(),
  startTime: z.date(),
  finishTime: z.date().nullable(),
  exportTime: z.date().nullable(),
  lastUpdated: z.date(),
  userId: z.string(),
  protocolId: z.string(),
  currentStep: z.number(),
  network: z.string(),
});

const safeLoadInterview = safeLoader({
  outputValidation: InterviewValidation,
  loader: async (id: string) => {
    const interview = await prisma.interview.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        protocol: true,
      },
    });

    return interview;
  },
});

export default async function Page({
  params,
}: {
  params: { interview: string };
}) {
  const interviewId = params.interview?.[0];
  const currentInterviewPage = params.interview?.[1]; // item || null

  // If theres no interview ID in the URL, redirect to the main dashboard
  if (!interviewId) {
    redirect('/');
  }

  // Get session so we can check if the user is allowed to view this interview
  const session = await getServerAuthSession();

  // If the user is not logged in, redirect to the signin page
  if (!session) {
    redirect('/signin');
  }

  // Fetch interview data from the database
  const interviewData = await safeLoadInterview(interviewId);

  // If theres no interview data in the database, redirect to the main dashboard
  if (!interviewData) {
    redirect('/');
  }

  // TODO: Check here that the logged in user has access to this interview
  // If not, redirect to the main dashboard

  // If theres no interview page in the URL:
  // (1) Check if there is a current stage in the DB, and redirect to it if there is
  // (2) Else, redirect to the stage 1
  if (!currentInterviewPage && interviewId) {
    if (interviewData.currentStep) {
      redirect(`/interview/${interviewId}/${interviewData.currentStep}`);
    }

    redirect(`/interview/${interviewId}/1`);

    return null;
  }

  // Fetch the protocol stage configuration for the current page from the database
  const {
    network,
    protocol: { stages },
  } = interviewData;

  const stagesJson = JSON.parse(stages) as StageType[];

  const currentStageConfig =
    stagesJson[parseInt(currentInterviewPage!, 10) - 1];

  if (!currentStageConfig) {
    redirect(`/interview/${interviewId}/1`);
  }

  const updateNetwork = async (network: NcNetwork) => {
    'use server';

    console.log('update network', network);

    // Simulate 2 second delay to test for slow API response not holding up UI.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // eslint-disable-next-line local-rules/require-data-mapper
    await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        network: JSON.stringify(network),
      },
    });
  };

  return (
    <NetworkProvider network={network} updateNetwork={updateNetwork}>
      <div className="flex h-[100vh] grow flex-col gap-10 p-10">
        <h1>Interview</h1>
        <Link href="/">Exit interview</Link>
        <Stage stageConfig={currentStageConfig} />
        <aside className="flex items-center justify-center">
          <InterviewNavigation />
        </aside>
      </div>
    </NetworkProvider>
  );
}
