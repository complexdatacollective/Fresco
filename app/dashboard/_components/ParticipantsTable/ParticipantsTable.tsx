import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { prisma } from '~/utils/db';
import { ParticipantsTableClient } from './ParticipantsTableClient';

export async function getParticipants() {
  const participants = await prisma.participant.findMany({
    include: {
      interviews: true,
      _count: { select: { interviews: true } },
    },
  });

  return participants;
}

export default function ParticipantsTable() {
  const participantsPromise = getParticipants();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={5} filterableColumnCount={3} />}
    >
      <ParticipantsTableClient participantsPromise={participantsPromise} />
    </Suspense>
  );
}
