import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from './Columns';
import { safeLoadParticipants } from './Loader';

const participants = await safeLoadParticipants;

export const ParticipantsTable = () => {
  return (
    <DataTable
      columns={ParticipantColumns}
      data={participants}
      filterColumnAccessorKey="name"
    />
  );
};
