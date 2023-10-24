'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import { DeleteParticipantConfirmationDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipant';
import type { ParticipantWithInterviews } from '~/shared/types';
import CopyButton from './CopyButton';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '../../participants/_components/DeleteAllParticipantsButton';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import EditParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/EditParticipantModal';

export const ParticipantsTable = ({
  initialData,
}: {
  initialData: ParticipantWithInterviews[];
}) => {
  const [seletedParticipant, setSeletedParticipant] = useState<string | null>(
    null,
  );
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteParticipantsInfo, setDeleteParticipantsInfo] = useState<{
    participantsToDelete: ParticipantWithInterviews[];
    hasInterviews: boolean;
    hasUnexportedInterviews: boolean;
  }>({
    participantsToDelete: [],
    hasInterviews: false,
    hasUnexportedInterviews: false,
  });

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

  const editParticipant = (identifier: string) => {
    setSeletedParticipant(identifier);
    setShowParticipantModal(true);
  };

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

  return (
    <>
      <div className="flex gap-2">
        <AddParticipantButton existingParticipants={participants} />
        <EditParticipantModal
          open={showParticipantModal}
          setOpen={setShowParticipantModal}
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
                  menuItems={[
                    {
                      label: 'Edit',
                      row,
                      component: (
                        <DropdownMenuItem
                          onClick={() =>
                            void editParticipant(row.original.identifier)
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                      ),
                    },
                    {
                      label: 'Delete',
                      row,
                      component: (
                        <DropdownMenuItem
                          onClick={() => void handleDelete([row.original])}
                        >
                          Delete
                        </DropdownMenuItem>
                      ),
                    },
                    {
                      label: 'Copy URL',
                      row,
                      component: (
                        <CopyButton text={`/interview/${row.original.id}`}>
                          Copy URL
                        </CopyButton>
                      ),
                    },
                  ]}
                />
              );
            },
          },
        ]}
      />
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
    </>
  );
};
