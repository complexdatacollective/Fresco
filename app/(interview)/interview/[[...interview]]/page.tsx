import { redirect } from 'next/navigation';
import { NetworkProvider } from '~/providers/NetworkProvider';
import Stage from '~/app/(interview)/interview/_components/Stage';
import InterviewNavigation from '~/app/(interview)/interview/_components/InterviewNavigation';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';
import Link from 'next/link';
import { trpc } from '~/app/_trpc/server';

export default async function Page({
  params,
}: {
  params: { interview: string };
}) {
  const interviewId = params.interview?.[0];
  const currentInterviewPage = params.interview?.[1]; // item || null

  // Fetch interview data from the database
  if (!interviewId) {
    return;
  }
  const interview = await trpc.interview.get.byId.query(
    { id: interviewId },
    {
      context: {
        revalidate: 0,
      },
    },
  );

  if (!interview) {
    return <div> No interview found</div>;
  }

  // If theres no interview page in the URL:
  // (1) Check if there is a current stage in the DB, and redirect to it if there is
  // (2) Else, redirect to the stage 1
  if (!currentInterviewPage && interviewId) {
    if (interview.currentStep) {
      redirect(`/interview/${interviewId}/${interview.currentStep}`);
    }

    redirect(`/interview/${interviewId}/1`);
  }

  // Fetch the protocol stage configuration for the current page from the database
  const network = interview.network as NcNetwork;
  const protocol = interview.protocol as unknown as Protocol;
  const stages = protocol.stages;

  const currentStageConfig = stages[parseInt(currentInterviewPage!, 10) - 1];

  if (!currentStageConfig) {
    return <div> No stage found</div>;
  }

  return (
    <NetworkProvider network={network} interviewId={interviewId}>
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
