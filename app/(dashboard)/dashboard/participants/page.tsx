import React from 'react';
import { ParticipantsTable } from '../_components/ParticipantsTable/ParticipantsTable';
import ParticipantModal from './_components/ParticipantModal';

const ParticipantPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Participant management view</h2>
      <ParticipantModal />
      <ParticipantsTable />
    </div>
  );
};

export default ParticipantPage;
