import { api } from '~/trpc/server';
import InterviewShell from '../_components/InterviewShell';
import NoSSRWrapper from '~/utils/NoSSRWrapper';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export type ServerSession = Prisma.InterviewGetPayload<null>;

export default async function Page({
  params,
}: {
  params: { interviewId: string };
}) {
  const { interviewId } = params;
  // Fetch interview data from the database
  if (!interviewId) {
    console.log('no interview ID...creating one');
    return 'No interview id found';
  }

  const interview = await api.interview.get.byId.query({ id: interviewId });

  if (!interview) {
    return 'No interview found';
  }

  const { protocol, ...serverSession } = interview;

  return (
    <div className="flex h-[100vh] max-h-[100vh] flex-col bg-[var(--nc-background)] text-[var(--nc-text)]">
      <NoSSRWrapper>
        <InterviewShell
          serverProtocol={protocol}
          serverSession={serverSession}
        />
      </NoSSRWrapper>
    </div>
  );
}
