import React from 'react';
import { ParticipantsTable } from '../_components/ParticipantsTable/ParticipantsTable';
import ParticipantModal from './_components/ParticipantModal';
import ImportCSVModal from './_components/ImportCSVModal';

const ParticipantPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <div className="flex gap-2">
        <ParticipantModal />
        <ImportCSVModal />
      </div>
      <ParticipantsTable />
    </div>
  );
};

export default ParticipantPage;
