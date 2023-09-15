import { ParticipantsTable } from '../_components/ParticipantsTable/ParticipantsTable';
import ExportCSVParticipants from './_components/ExportCSVParticipants';
import ImportCSVModal from './_components/ImportCSVModal';
import ParticipantModal from './_components/ParticipantModal';
import { safeLoadParticipants } from '../_components/ParticipantsTable/Loader';

export const revalidate = 0;

const ParticipantPage = async () => {
  const participants = await safeLoadParticipants();

  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <div className="flex gap-2">
        <ParticipantModal />
        <ImportCSVModal />
        <ExportCSVParticipants participants={participants} />
      </div>
      <ParticipantsTable participants={participants} />
    </div>
  );
};

export default ParticipantPage;
