'use client';

import { type Participant } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';
import { DeleteAllParticipantsButton } from '../../participants/_components/DeleteAllParticipantsButton';

export const ParticipantsTable = ({
  initialData,
}: {
  initialData: Participant[];
}) => {
  const [seletedParticipant, setSeletedParticipant] = useState<string | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const {
    isLoading,
    refetch,
    data: participants,
  } = trpc.participant.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onError(error) {
      // eslint-disable-next-line no-console
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
        <ParticipantModal
          open={showModal}
          setOpen={setShowModal}
          existingParticipants={participants}
          editingParticipant={seletedParticipant}
          setEditingParticipant={setSeletedParticipant}
        />
        <ImportCSVModal />
        <ExportCSVParticipants participants={participants} />
        <DeleteAllParticipantsButton />
      </div>
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
