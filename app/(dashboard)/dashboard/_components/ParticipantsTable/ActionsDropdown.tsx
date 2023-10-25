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
import { DeleteParticipantsDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipantsDialog';

export const ActionsDropdown = ({
  row,
  participants,
}: {
  row: Row<ParticipantWithInterviews>;
  participants: ParticipantWithInterviews[];
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null,
  );
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] =
    useState<ParticipantWithInterviews[]>();

  const editParticipant = (identifier: string) => {
    setSelectedParticipant(identifier);
    setShowParticipantModal(true);
  };

  const handleDelete = (data: ParticipantWithInterviews) => {
    setParticipantToDelete([data]);
    setShowDeleteModal(true);
  };

  return (
    <>
      <EditParticipantModal
        open={showParticipantModal}
        setOpen={setShowParticipantModal}
        existingParticipants={participants}
        editingParticipant={selectedParticipant}
        setEditingParticipant={setSelectedParticipant}
      />
      <DeleteParticipantsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        participantsToDelete={participantToDelete || []}
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
          <DropdownMenuItem onClick={() => handleDelete(row.original)}>
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
