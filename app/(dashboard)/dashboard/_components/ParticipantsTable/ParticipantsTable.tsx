'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';
import { DeleteParticipant } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipant';
import type { ParticipantWithInterviews } from '~/shared/types';
import { Button } from '~/components/ui/Button';

export const ParticipantsTable = ({
  initialData,
}: {
  initialData: ParticipantWithInterviews[];
}) => {
  const [seletedParticipant, setSeletedParticipant] = useState<string | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [participantsToDelete, setParticipantsToDelete] = useState<
    ParticipantWithInterviews[]
  >([]);
  const [deleteAll, setDeleteAll] = useState(false);

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

  const { mutateAsync: deleteParticipants, isLoading: isDeleting } =
    trpc.participant.delete.byId.useMutation();

  const { mutateAsync: deleteAllParticipants, isLoading: isDeletingAll } =
    trpc.participant.delete.all.useMutation();

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setShowModal(true);
  };

  const handleDelete = (data: ParticipantWithInterviews[]) => {
    setDeleteAll(false);
    setParticipantsToDelete(data);
    setShowAlertDialog(true);
  };

  const handleDeleteAll = () => {
    setDeleteAll(true);
    setParticipantsToDelete(participants);
    setShowAlertDialog(true);
  };

  const handleConfirm = async () => {
    if (deleteAll) {
      await deleteAllParticipants();
      await refetch();
    }

    // Delete selected participants
    await deleteParticipants(participantsToDelete.map((d) => d.identifier));
    await refetch();
    setShowAlertDialog(false);
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
        <Button onClick={handleDeleteAll} variant="destructive">
          Delete All Participants
        </Button>
      </div>
      {isLoading && <div>Loading...</div>}
      <DataTable
        columns={ParticipantColumns(editParticipant, handleDelete)}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
      />
      <DeleteParticipant
        open={showAlertDialog}
        onCancel={() => setShowAlertDialog(false)}
        onConfirm={handleConfirm}
        selectedParticipants={participantsToDelete}
        isDeleting={deleteAll ? isDeletingAll : isDeleting}
      />
    </>
  );
};
