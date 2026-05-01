import type { Row } from '@tanstack/react-table';
import { DeleteIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { IconButton } from '@codaco/fresco-ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/DropdownMenu';
import type { ParticipantWithInterviews } from './ParticipantsTableClient';

export function ActionsDropdown({
  row,
  onEdit,
  onDelete,
}: {
  row: Row<ParticipantWithInterviews>;
  onEdit: (participant: ParticipantWithInterviews) => void;
  onDelete: (participant: ParticipantWithInterviews) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            variant="text"
            aria-label="Open menu"
            icon={<MoreHorizontal />}
            size="sm"
          />
        }
        nativeButton
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onEdit(row.original)}
            icon={<PencilIcon />}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(row.original)}
            icon={<DeleteIcon />}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
