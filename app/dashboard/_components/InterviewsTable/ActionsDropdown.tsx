'use client';

import type { Row } from '@tanstack/react-table';
import {
  DeleteIcon,
  DoorOpenIcon,
  FileIcon,
  MoreHorizontal,
} from 'lucide-react';
import { hash as objectHash } from 'ohash';
import { useState } from 'react';

import { IconButton } from '@codaco/fresco-ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/DropdownMenu';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import type { GetInterviewsQuery } from '~/queries/interviews';

type InterviewRow = GetInterviewsQuery[number];

export const ActionsDropdown = ({ row }: { row: Row<InterviewRow> }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedInterviews, setSelectedInterviews] =
    useState<InterviewRow[]>();

  const handleDelete = (data: InterviewRow) => {
    setSelectedInterviews([data]);
    setShowDeleteModal(true);
  };

  const handleExport = (data: InterviewRow) => {
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
        interviewIds={(selectedInterviews ?? []).map(
          (interview) => interview.id,
        )}
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
              size="sm"
            />
          }
          nativeButton
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              icon={<DeleteIcon />}
            >
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport(row.original)}
              icon={<FileIcon />}
            >
              Export
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {/* Deliberately a full page load rather than a client-side <Link>.
              Session replay must never run on an interview: it stores the
              page URL — which is the participant's access credential — inside
              its payload. A client-side navigation changes the URL and renders
              the interview before any effect can stop a recorder that is
              already running, whereas a fresh load re-initialises PostHog with
              replay disabled before anything is captured. */}
          <a href={`/interview/${row.original.id}`}>
            <DropdownMenuItem icon={<DoorOpenIcon />}>
              Enter Interview
            </DropdownMenuItem>
          </a>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
