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
import { useState } from 'react';
import { DeleteInterviewsDialog } from '~/app/(dashboard)/dashboard/interviews/_components/DeleteInterviewsDialog';
import type { Interview } from '@prisma/client';

export const ActionsDropdown = ({ row }: { row: Row<Interview> }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview[]>();

  const handleDelete = (data: Interview) => {
    setInterviewToDelete([data]);
    setShowDeleteModal(true);
  };

  return (
    <>
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={interviewToDelete || []}
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
