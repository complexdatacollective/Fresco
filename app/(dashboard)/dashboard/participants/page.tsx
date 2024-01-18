import { Suspense } from 'react';
import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';

const ParticipantPage = async () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <Suspense fallback={<div>Loading participants...</div>}>
        <ParticipantsTable />
      </Suspense>
    </div>
  );
};

export default ParticipantPage;
