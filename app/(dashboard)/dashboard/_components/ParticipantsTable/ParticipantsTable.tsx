'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { useParticipants } from '../ParticipantsProvider';
import { ParticipantColumns } from './Columns';
import ParticipantModal from '../../participants/_components/ParticipantModal';
import { useState } from 'react';
import { deleteParticipant } from '../../participants/_actions/actions';

export const ParticipantsTable = () => {
  const { isLoading, participants } = useParticipants();
  const [open, setOpen] = useState(false);
  const [seletedParticipant, setSeletedParticipant] = useState('');

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const data = await deleteParticipant(id);
    if (data.error) throw new Error(data.error);
  };

  if (isLoading || !participants) {
    return 'Loading...';
  }

  return (
    <>
      <ParticipantModal
        open={open}
        setOpen={setOpen}
        participants={participants}
        seletedParticipant={seletedParticipant}
        setSeletedParticipant={setSeletedParticipant}
      />
      <DataTable
        columns={ParticipantColumns(editParticipant, handleDelete)}
        data={participants}
        filterColumnAccessorKey="identifier"
      />
    </>
  );
};
