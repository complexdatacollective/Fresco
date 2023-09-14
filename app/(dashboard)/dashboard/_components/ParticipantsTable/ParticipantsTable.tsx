'use client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from './Columns';
import { safeLoadParticipants } from './Loader';
import type { Participant } from '@prisma/client';

// const participants = await safeLoadParticipants;

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
