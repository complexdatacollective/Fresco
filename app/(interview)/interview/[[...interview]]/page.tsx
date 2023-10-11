import { redirect } from 'next/navigation';
import { InterviewProvider } from '~/providers/InterviewProvider';
import Stage from '~/app/(interview)/interview/_components/Stage';
import InterviewNavigation from '~/app/(interview)/interview/_components/InterviewNavigation';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';
import Link from 'next/link';
import { trpc } from '~/app/_trpc/server';
import { Button } from '~/components/ui/Button';

export const dynamic = 'force-dynamic';

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

  console.log('network', network);

  return (
    <InterviewProvider
      network={network}
      interviewId={interviewId}
      protocol={protocol}
    >
      <div className="flex grow flex-col justify-between p-10">
        <h1 className="text-3xl">Interview</h1>
        <Link href="/">
          <Button>Exit Interview</Button>
        </Link>
        <Stage stageConfig={currentStageConfig} />
        <aside className="flex items-center justify-center">
          <InterviewNavigation />
        </aside>
      </div>
    </InterviewProvider>
  );
}
