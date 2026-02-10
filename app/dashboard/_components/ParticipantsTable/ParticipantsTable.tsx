import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getParticipants } from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';
import { ParticipantsTableClient } from './ParticipantsTableClient';

export default function ParticipantsTable() {
  const participantsPromise = getParticipants();
  const protocolsPromise = getProtocols();

  return (
    <Suspense
      fallback={
        <DataTableSkeleton
          columnCount={4}
          searchableColumnCount={1}
          headerItemsCount={3}
        />
      }
    >
      <ParticipantsTableClient
        participantsPromise={participantsPromise}
        protocolsPromise={protocolsPromise}
      />
    </Suspense>
  );
}
