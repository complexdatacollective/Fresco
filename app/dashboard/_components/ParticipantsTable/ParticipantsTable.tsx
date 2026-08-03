import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import {
  getParticipants,
  getParticipantsForSelect,
} from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';
import { ParticipantsTableClient } from './ParticipantsTableClient';
import type { ParticipantsSearchParams } from './searchParams';

export default function ParticipantsTable({
  searchParams,
}: {
  searchParams: ParticipantsSearchParams;
}) {
  const participantsPromise = getParticipants(searchParams);
  const allParticipantsPromise = getParticipantsForSelect();
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
        allParticipantsPromise={allParticipantsPromise}
        protocolsPromise={protocolsPromise}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
