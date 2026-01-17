'use client';

import type { Interview } from '~/lib/db/generated/client';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { hash as objectHash } from 'ohash';
import { useState } from 'react';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { IconButton } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export const ActionsDropdown = ({ row }: { row: Row<Interview> }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedInterviews, setSelectedInterviews] = useState<Interview[]>();

  const handleDelete = (data: Interview) => {
    setSelectedInterviews([data]);
    setShowDeleteModal(true);
  };

  const handleExport = (data: Interview) => {
    setSelectedInterviews([data]);
    setShowExportModal(true);
  };

  const handleResetExport = () => {
    setSelectedInterviews([]);
    setShowExportModal(false);
  };

  return (
    <>
      <ExportInterviewsDialog
        key={objectHash(selectedInterviews)}
        open={showExportModal}
        handleCancel={handleResetExport}
        interviewsToExport={selectedInterviews!}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={selectedInterviews ?? []}
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
            <DropdownMenuItem onClick={() => handleExport(row.original)}>
              Export
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <Link href={`/interview/${row.original.id}`}>
            <DropdownMenuItem>Enter Interview</DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
