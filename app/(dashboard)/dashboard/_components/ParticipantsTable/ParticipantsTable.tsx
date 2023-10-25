'use client';

import { api } from '~/trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import type { ParticipantWithInterviews } from '~/shared/types';
import { Settings } from 'lucide-react';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '~/app/(dashboard)/dashboard/participants/_components/DeleteAllParticipantsButton';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import { useState } from 'react';
import { DeleteParticipantConfirmationDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipant';
export const ParticipantsTable = ({
  initialData,
}: {
  initialData: ParticipantWithInterviews[];
}) => {
  const {
    isLoading,
    refetch,
    data: participants,
  } = api.participant.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onError(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });
  const [deleteParticipantsInfo, setDeleteParticipantsInfo] = useState<{
    participantsToDelete: ParticipantWithInterviews[];
    hasInterviews: boolean;
    hasUnexportedInterviews: boolean;
  }>({
    participantsToDelete: [],
    hasInterviews: false,
    hasUnexportedInterviews: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (data: ParticipantWithInterviews[]) => {
    setDeleteParticipantsInfo({
      participantsToDelete: data,
      hasInterviews: data.some(
        (participant) => participant.interviews.length > 0,
      ),
      hasUnexportedInterviews: data.some((participant) =>
        participant.interviews.some((interview) => !interview.exportTime),
      ),
    });
    setShowDeleteModal(true);
  };

  const { mutateAsync: deleteParticipants, isLoading: isDeleting } =
    api.participant.delete.byId.useMutation();

  const handleConfirm = async () => {
    // Delete selected participants
    await deleteParticipants(
      deleteParticipantsInfo.participantsToDelete.map((d) => d.identifier),
    );
    await refetch();
    setDeleteParticipantsInfo({
      participantsToDelete: [],
      hasInterviews: false,
      hasUnexportedInterviews: false,
    });
    setShowDeleteModal(false);
  };

  const handleCancelDialog = () => {
    setDeleteParticipantsInfo({
      participantsToDelete: [],
      hasInterviews: false,
      hasUnexportedInterviews: false,
    });
    setShowDeleteModal(false);
  };

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <>
      <div className="flex gap-2">
        <AddParticipantButton existingParticipants={participants} />
        <ImportCSVModal />
        <ExportCSVParticipants participants={participants} />
        <DeleteAllParticipantsButton />
      </div>
      {isLoading && <div>Loading...</div>}
      <DeleteParticipantConfirmationDialog
        open={showDeleteModal}
        onCancel={handleCancelDialog}
        onConfirm={handleConfirm}
        numberOfParticipants={
          deleteParticipantsInfo.participantsToDelete.length
        }
        hasInterviews={deleteParticipantsInfo.hasInterviews}
        hasUnexportedInterviews={deleteParticipantsInfo.hasUnexportedInterviews}
        isDeleting={isDeleting}
      />
      <DataTable
        columns={ParticipantColumns()}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
        actions={[
          {
            id: 'actions',
            header: () => <Settings />,
            cell: ({ row }) => {
              return (
                <ActionsDropdown
                  row={row}
                  participants={participants}
                  refetch={handleRefetch}
                />
              );
            },
          },
        ]}
      />
    </>
  );
};
