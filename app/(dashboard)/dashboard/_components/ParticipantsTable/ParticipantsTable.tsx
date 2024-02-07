'use client';

import { api } from '~/trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import type { ParticipantWithInterviews } from '~/shared/types';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '~/app/(dashboard)/dashboard/participants/_components/DeleteAllParticipantsButton';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import { useState } from 'react';
import { DeleteParticipantsDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipantsDialog';
import ExportParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportParticipants';
export const ParticipantsTable = ({
  initialData,
}: {
  initialData: ParticipantWithInterviews[];
}) => {
  const { isLoading, data: participants } = api.participant.get.all.useQuery(
    undefined,
    {
      initialData,
      refetchOnMount: false,
      onError(error) {
        throw new Error(error.message);
      },
    },
  );

  const [participantsToDelete, setParticipantsToDelete] =
    useState<ParticipantWithInterviews[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (data: ParticipantWithInterviews[]) => {
    setParticipantsToDelete(data);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <DeleteParticipantsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        participantsToDelete={participantsToDelete ?? []}
      />
      <DataTable
        columns={ParticipantColumns()}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
        headerItems={
          <>
            <AddParticipantButton existingParticipants={participants} />
            <ImportCSVModal />
            <ExportParticipants participants={participants} />
            <DeleteAllParticipantsButton />
          </>
        }
      />
    </>
  );
};
