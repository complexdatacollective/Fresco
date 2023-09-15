'use client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from './Columns';
import type { Participant } from '@prisma/client';

export const ParticipantsTable = ({
  participants,
}: {
  participants: Participant[];
}) => {
  return (
    <DataTable
      columns={ParticipantColumns}
      data={participants}
      filterColumnAccessorKey="identifier"
    />
  );
};
