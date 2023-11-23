import { InterviewProvider } from '~/providers/InterviewProvider';
import Stage from '~/app/(interview)/interview/_components/Stage';
import InterviewNavigation from '~/app/(interview)/interview/_components/InterviewNavigation';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';
import Link from 'next/link';
import { api } from '~/trpc/server';
import { Button } from '~/components/ui/Button';
import InterviewShell from '../_components/InterviewShell';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  console.log(params);
  const { interviewId } = params;
  console.log('interviewId', interviewId);
  // Fetch interview data from the database
  if (!interviewId) {
    console.log('no interview ID...creating one');
    return 'No interview id found';
  }

  const interview = await api.interview.get.byId.query({ id: interviewId });

  console.log('interview', interview);

  if (!interview) {
    return 'No interview found';
  }

  const initialNetwork = interview.network as NcNetwork;
  const interviewProtocol = interview.protocol as unknown as Protocol;

  return (
    <InterviewProvider
      interviewId={interviewId}
      initialNetwork={initialNetwork}
      protocol={interviewProtocol}
    >
      {/* <div className="flex grow flex-col justify-between p-10">
        <h1 className="text-3xl">Interview</h1>
        <Link href="/">
          <Button>Exit Interview</Button>
        </Link>
        <Stage />
        <aside className="flex items-center justify-center">
          <InterviewNavigation />
        </aside>
      </div> */}
      <InterviewShell />
    </InterviewProvider>
  );
}
