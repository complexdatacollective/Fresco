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
  });
  return participants;
};
const participants = await getParticipants();

export const ParticipantsTable = () => {
  return <DataTable columns={ParticipantColumns} data={participants} />;
};
