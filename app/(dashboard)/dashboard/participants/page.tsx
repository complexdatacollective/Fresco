import { ParticipantsTable } from '../_components/ParticipantsTable/ParticipantsTable';
import ExportCSVParticipants from './_components/ExportCSVParticipants';
import ImportCSVModal from './_components/ImportCSVModal';
import ParticipantModal from './_components/ParticipantModal';
import { safeLoadParticipants } from '../_components/ParticipantsTable/Loader';
import { ParticipantsProvider } from '../_components/ParticipantsProvider';

export const revalidate = 0;

const ParticipantPage = () => {
  const participantsPromise = safeLoadParticipants();

  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <ParticipantsProvider getParticipants={participantsPromise}>
        <div className="flex gap-2">
          <ParticipantModal />
          <ImportCSVModal />
          <ExportCSVParticipants />
        </div>
        <ParticipantsTable />
      </ParticipantsProvider>
    </div>
  );
};

export default ParticipantPage;
