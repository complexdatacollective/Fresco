import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import { trpc } from '~/app/_trpc/server';

const ParticipantPage = async () => {
  const participants = await trpc.participant.get.all.query(undefined, {
    context: {
      revalidate: 0,
    },
  });
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <ParticipantsTable initialData={participants} />
    </div>
  );
};

export default ParticipantPage;
