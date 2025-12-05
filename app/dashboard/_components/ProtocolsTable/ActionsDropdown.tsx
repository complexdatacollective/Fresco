'use client';

import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { IconButton } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

export const ActionsDropdown = ({
  row,
}: {
  row: Row<ProtocolWithInterviews>;
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [protocolToDelete, setProtocolToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews) => {
    setProtocolToDelete([data]);
    setShowDeleteModal(true);
  };

  return (
    <>
      <DeleteProtocolsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        protocolsToDelete={protocolToDelete ?? []}
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
            <DropdownMenuItem onClick={() => handleDelete(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
