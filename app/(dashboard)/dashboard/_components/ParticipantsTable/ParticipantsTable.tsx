'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { DataTable } from '~/components/DataTable/DataTable';
import { ParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipants';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';
import { DeleteParticipantConfirmationDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipant';
import type { ParticipantWithInterviews } from '~/shared/types';
import CopyButton from './CopyButton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '../../participants/_components/DeleteAllParticipantsButton';

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
  const [participantsToDelete, setParticipantsToDelete] = useState<
    ParticipantWithInterviews[]
  >([]);
  const [hasInterviews, setHasInterviews] = useState(false);
  const [hasUnexportedInterviews, setHasUnexportedInterviews] = useState(false);

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
    setParticipantsToDelete(data);
    setHasInterviews(
      participantsToDelete.some(
        (participant) => participant.interviews.length > 0,
      ),
    );
    setHasUnexportedInterviews(
      participantsToDelete.some((participant) =>
        participant.interviews.some((interview) => !interview.exportTime),
      ),
    );
    setShowDeleteModal(true);
  };

  const handleConfirm = async () => {
    // Delete selected participants
    await deleteParticipants(participantsToDelete.map((d) => d.identifier));
    await refetch();
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <ParticipantModal
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
            header: () => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Settings />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit or delete an individual participant.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ),
            cell: ({ row }) => {
              return (
                <ActionsDropdown
                  menuItems={[
                    {
                      label: 'Edit',
                      row,
                      component: (
                        <DropdownMenuItem
                          onClick={() => void editParticipant(row.original.id)}
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
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirm}
        numberOfParticipants={participantsToDelete.length}
        hasInterviews={hasInterviews}
        hasUnexportedInterviews={hasUnexportedInterviews}
        isDeleting={isDeleting}
      />
    </>
  );
};
