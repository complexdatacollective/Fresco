import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic';

const ParticipantPage = async () => {
  const participants = await api.participant.get.all.query();
  return (
    <ResponsiveContainer>
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <ParticipantsTable initialData={participants} />
    </ResponsiveContainer>
  );
};

export default ParticipantPage;
