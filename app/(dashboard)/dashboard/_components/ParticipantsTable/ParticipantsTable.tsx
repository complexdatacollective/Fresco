'use client';

import { type Participant } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';

export const ParticipantsTable = () => {
  const participants = trpc.participants.get.useQuery();
  const [seletedParticipant, setSeletedParticipant] = useState('');
  const [open, setOpen] = useState(false);

  const { mutateAsync: deleteParticipant } =
    trpc.participants.deleteSingle.useMutation({
      async onSuccess() {
        await participants.refetch();
      },
    });

  const { mutateAsync: deleteParticipants, isLoading: isDeletedSelected } =
    trpc.participants.deleteMany.useMutation({
      async onSuccess() {
        await participants.refetch();
      },
    });

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteParticipant({ id });
    if (result.error) throw new Error(result.error);
  };

  const handleDeleteSelected = async (data: Participant[]) => {
    const result = await deleteParticipants(data);
    if (result.error) throw new Error(result.error);
  };

  if (!participants.data) return 'Loading...';

  return (
    <>
      <div className="flex gap-2">
        <ImportCSVModal refetch={participants.refetch} />
        <ExportCSVParticipants participants={participants.data} />
      </div>
      <ParticipantModal
        open={open}
        setOpen={setOpen}
        participants={participants.data}
        refetch={participants.refetch}
        seletedParticipant={seletedParticipant}
        setSeletedParticipant={setSeletedParticipant}
      />
      <DataTable
        columns={ParticipantColumns(editParticipant, handleDelete)}
        data={participants.data}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDeleteSelected}
        isDeletedSelected={isDeletedSelected}
      />
    </>
  );
};
