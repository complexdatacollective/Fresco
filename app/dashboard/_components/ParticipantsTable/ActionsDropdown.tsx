import type { Participant } from '~/lib/db/generated/client';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { IconButton } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { ParticipantWithInterviews } from './ParticipantsTableClient';

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
        <DropdownMenuTrigger
          render={
            <IconButton
              variant="text"
              aria-label="Open menu"
              icon={<MoreHorizontal />}
            />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => editParticipant(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteHandler(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
