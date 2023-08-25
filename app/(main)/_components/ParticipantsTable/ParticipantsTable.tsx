import { prisma } from '~/utils/db';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(main)/_components/ParticipantsTable/Columns';

const getParticipants = async () => {
  const participants = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          name: 'PARTICIPANT',
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return participants;
};
const participants = await getParticipants();

export const ParticipantsTable = () => {
  return (
    <DataTable
      columns={ParticipantColumns}
      data={participants}
      filterColumnAccessorKey="name"
    />
  );
};
