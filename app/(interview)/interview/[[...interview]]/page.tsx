'use client';

import { redirect, usePathname } from 'next/navigation';
import { InterviewProvider } from '~/providers/InterviewProvider';
import Stage from '~/app/(interview)/interview/_components/Stage';
import InterviewNavigation from '~/app/(interview)/interview/_components/InterviewNavigation';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';
import Link from 'next/link';
import { trpc } from '~/app/_trpc/client';
import { Button } from '~/components/ui/Button';

export default function Page({ params }: { params: { interview: string } }) {
  const pathname = usePathname();
  const currentInterviewPage = pathname.split('/').pop();
  const interviewId = params.interview[0];

  console.log('currentInterviewPage', currentInterviewPage, interviewId);

  // Fetch interview data from the database
  if (!interviewId) {
    return;
  }

  // If theres no interview page in the URL:
  // (1) Check if there is a current stage in the DB, and redirect to it if there is
  // (2) Else, redirect to the stage 1
  // if (!currentInterviewPage && interviewId) {
  //   if (interview.currentStep) {
  //     redirect(`/interview/${interviewId}/${interview.currentStep}`);
  //   }

  //   redirect(`/interview/${interviewId}/1`);
  // }

  // Fetch the protocol stage configuration for the current page from the database
  // const network = interview.network as NcNetwork;
  // const protocol = interview.protocol as unknown as Protocol;
  // const stages = protocol.stages;

  // const currentStageConfig = stages[parseInt(currentInterviewPage!, 10) - 1];

  // if (!currentStageConfig) {
  //   return <div> No stage found</div>;
  // }

  // console.log('network', network);

  return (
    <InterviewProvider>
      <div className="flex grow flex-col justify-between p-10">
        <h1 className="text-3xl">Interview</h1>
        <Link href="/">
          <Button>Exit Interview</Button>
        </Link>
        <Stage />
        <aside className="flex items-center justify-center">
          <InterviewNavigation />
        </aside>
      </div>
    </InterviewProvider>
  );
}
