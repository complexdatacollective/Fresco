'use client';

import { type Participant } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';

export const ParticipantsTable = ({
  initialData,
}: {
  initialData: Participant[];
}) => {
  const [participants, setParticipants] = useState(initialData);
  const [seletedParticipant, setSeletedParticipant] = useState<string | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const { isLoading, refetch } = trpc.participant.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onSuccess(data) {
      setParticipants(data);
    },
    onError(error) {
      console.error(error);
    },
  });

  const { mutateAsync: deleteParticipants } =
    trpc.participant.delete.byId.useMutation();

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setShowModal(true);
  };

  const handleDelete = async (data: Participant[]) => {
    await deleteParticipants(data.map((d) => d.identifier));
    await refetch();
  };

  return (
    <>
      <div className="flex gap-2">
        <ImportCSVModal />
        <ExportCSVParticipants />
      </div>
      <ParticipantModal
        open={showModal}
        setOpen={setShowModal}
        existingParticipants={participants}
        editingParticipant={seletedParticipant}
      />
      {isLoading && <div>Loading...</div>}
      <DataTable
        columns={ParticipantColumns(editParticipant, handleDelete)}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
      />
    </>
  );
};
