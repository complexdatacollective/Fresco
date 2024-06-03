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
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import type { ParticipantWithInterviews } from '~/types/types';
import type { Participant } from '@prisma/client';

export const ActionsDropdown = ({
  row,
  data,
  deleteHandler,
}: {
  row: Row<ParticipantWithInterviews>;
  data: ParticipantWithInterviews[];
  deleteHandler: (participant: ParticipantWithInterviews) => void;
}) => {
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);

  const editParticipant = (data: Participant) => {
    setSelectedParticipant(data);
    setShowParticipantModal(true);
  };

  return (
    <>
      <ParticipantModal
        open={showParticipantModal}
        setOpen={setShowParticipantModal}
        existingParticipants={data}
        editingParticipant={selectedParticipant}
        setEditingParticipant={setSelectedParticipant}
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
          <DropdownMenuItem onClick={() => editParticipant(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteHandler(row.original)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
