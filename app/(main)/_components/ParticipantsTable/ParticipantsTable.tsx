import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(main)/_components/ParticipantsTable/Columns';
import { safeLoadParticipants } from './Loader';

const participants = await safeLoadParticipants();

export const ParticipantsTable = () => {
  return (
    <DataTable
      columns={ParticipantColumns}
      data={participants}
      filterColumnAccessorKey="name"
    />
  );
};
