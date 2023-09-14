import { ParticipantsTable } from '../_components/ParticipantsTable/ParticipantsTable';
import ExportCSVParticipants from './_components/ExportCSVParticipants';
import ImportCSVModal from './_components/ImportCSVModal';
import ParticipantModal from './_components/ParticipantModal';

export const revalidate = 0;

const ParticipantPage = async () => {
  const data: any = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/participants`,
    {
      method: 'GET',
    },
  ).then(async (res) => await res.json());

  if (data.error) return null;

  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <div className="flex gap-2">
        <ParticipantModal />
        <ImportCSVModal />
        <ExportCSVParticipants participants={data.participants} />
      </div>
      <ParticipantsTable participants={data.participants} />
    </div>
  );
};

export default ParticipantPage;
