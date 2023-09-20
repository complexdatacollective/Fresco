'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { useParticipants } from '../ParticipantsProvider';
import { ParticipantColumns } from './Columns';
import ParticipantModal from '../../participants/_components/ParticipantModal';
import { useState } from 'react';
import {
  deleteParticipant,
  deleteParticipants,
} from '../../participants/_actions/actions';
import { type Participant } from '@prisma/client';

export const ParticipantsTable = () => {
  const { isLoading, participants } = useParticipants();
  const [seletedParticipant, setSeletedParticipant] = useState('');
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [open, setOpen] = useState(false);

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteParticipant(id);
    if (result.error) throw new Error(result.error);
  };

  const handleDeleteSelected = async (data: Participant[]) => {
    setIsDeletingSelected(true);
    const result = await deleteParticipants(data);
    if (result.error) throw new Error(result.error);
    setIsDeletingSelected(false);
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
        handleDeleteSelected={handleDeleteSelected}
        isDeletingSelected={isDeletingSelected}
      />
    </>
  );
};
