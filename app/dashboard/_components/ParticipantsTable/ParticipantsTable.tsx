import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { ParticipantsTableClient } from './ParticipantsTableClient';
import { getParticipants } from '~/queries/participants';

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
