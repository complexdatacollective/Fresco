import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import { trpc } from '~/app/_trpc/proxy';

const ParticipantPage = async () => {
  const participants = await trpc.participant.get.all.query();
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <ParticipantsTable initialData={participants} />
    </div>
  );
};

export default ParticipantPage;
