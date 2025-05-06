'use client';

import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { type GetProtocolsReturnType } from '~/queries/protocols';

export const ActionsDropdown = ({
  row,
}: {
  row: Row<Awaited<GetProtocolsReturnType>[0]>;
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [protocolToDelete, setProtocolToDelete] =
    useState<Awaited<GetProtocolsReturnType>[0][]>();

  const handleDelete = (data: Awaited<GetProtocolsReturnType>[0]) => {
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
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleDelete(row.original)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
