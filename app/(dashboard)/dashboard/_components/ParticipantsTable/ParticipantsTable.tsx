'use client';

import { api } from '~/trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import type { ParticipantWithInterviews } from '~/shared/types';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '~/app/(dashboard)/dashboard/participants/_components/DeleteAllParticipantsButton';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import { useState } from 'react';
import { DeleteParticipantsDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipantsDialog';
export const ParticipantsTable = () => {
  const [participants] = api.participant.get.all.useSuspenseQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });
  const [participantsToDelete, setParticipantsToDelete] =
    useState<ParticipantWithInterviews[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (data: ParticipantWithInterviews[]) => {
    setParticipantsToDelete(data);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <AddParticipantButton existingParticipants={participants} />
        <ImportCSVModal />
        <ExportCSVParticipants participants={participants} />
        <DeleteAllParticipantsButton />
      </div>
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
      />
    </>
  );
};
