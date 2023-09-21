'use client';

import { type Participant } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import ParticipantModal from '../../participants/_components/ParticipantModal';
import { useParticipants } from '../ParticipantsProvider';
import { ParticipantColumns } from './Columns';

export const ParticipantsTable = () => {
  const { isLoading, participants } = useParticipants();
  const [seletedParticipant, setSeletedParticipant] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { mutateAsync: deleteParticipant } =
    trpc.participants.deleteSingle.useMutation();

  const { mutateAsync: deleteParticipants, isLoading: isDeletingSelected } =
    trpc.participants.deleteMany.useMutation();

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteParticipant({ id });
    if (result.error) throw new Error(result.error);
    router.refresh();
  };

  const handleDeleteSelected = async (data: Participant[]) => {
    const result = await deleteParticipants(data);
    if (result.error) throw new Error(result.error);
    router.refresh();
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
