'use client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from './Columns';
import { useParticipants } from '../ParticipantsProvider';

export const ParticipantsTable = () => {
  const { isLoading, participants } = useParticipants();

  if (isLoading) {
    return 'Loading...';
  }

  return (
    <DataTable
      columns={ParticipantColumns}
      data={participants}
      filterColumnAccessorKey="identifier"
    />
  );
};
