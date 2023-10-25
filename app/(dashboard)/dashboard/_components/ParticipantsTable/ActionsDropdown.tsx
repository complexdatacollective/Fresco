'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { Row } from '@tanstack/react-table';
import CopyButton from './CopyButton';
import { useState } from 'react';
import EditParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/EditParticipantModal';
import type { ParticipantWithInterviews } from '~/shared/types';
import { api } from '~/trpc/client';
import { DeleteParticipantConfirmationDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipant';

export const ActionsDropdown = ({
  row,
  participants,
  refetch,
}: {
  row: Row<ParticipantWithInterviews>;
  participants: ParticipantWithInterviews[];
  refetch: () => Promise<void>;
}) => {
  const [seletedParticipant, setSeletedParticipant] = useState<string | null>(
    null,
  );
  const [showParticipantModal, setShowParticipantModal] = useState(false);
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

  return (
    <>
      <EditParticipantModal
        open={showParticipantModal}
        setOpen={setShowParticipantModal}
        existingParticipants={participants}
        editingParticipant={seletedParticipant}
        setEditingParticipant={setSeletedParticipant}
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => editParticipant(row.original.identifier)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete([row.original])}>
            Delete
          </DropdownMenuItem>

          <CopyButton text={`/interview/${row.original.id}`}>
            Copy URL
          </CopyButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
