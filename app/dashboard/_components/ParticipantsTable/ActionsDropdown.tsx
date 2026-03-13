import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
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
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
