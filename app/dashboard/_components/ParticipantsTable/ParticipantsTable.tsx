import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { ParticipantsTableClient } from './ParticipantsTableClient';
import { getParticipants } from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';

export default function ParticipantsTable() {
  const participantsPromise = getParticipants();
  const protocolsPromise = getProtocols();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={5} filterableColumnCount={3} />}
    >
      <ParticipantsTableClient
        participantsPromise={participantsPromise}
        protocolsPromise={protocolsPromise}
      />
    </Suspense>
  );
}
