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

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { IconButton } from '@codaco/fresco-ui/Button';
import { type DataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
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

const messages = defineMessages({
  openMenu: {
    id: 'fresco.InterviewsTable.ActionsDropdown.openMenu',
    defaultMessage: 'Open menu',
    description:
      'Researcher-facing InterviewsTable / ActionsDropdown: Open menu',
  },
  actions: {
    id: 'fresco.InterviewsTable.ActionsDropdown.actions',
    defaultMessage: 'Actions',
    description: 'Researcher-facing InterviewsTable / ActionsDropdown: Actions',
  },
  export: {
    id: 'fresco.InterviewsTable.ActionsDropdown.export',
    defaultMessage: 'Export',
    description: 'Researcher-facing InterviewsTable / ActionsDropdown: Export',
  },
  enterInterview: {
    id: 'fresco.InterviewsTable.ActionsDropdown.enterInterview',
    defaultMessage: 'Enter Interview',
    description:
      'Researcher-facing InterviewsTable / ActionsDropdown: Enter Interview',
  },
});

type InterviewRow = GetInterviewsQuery[number];

export const ActionsDropdown = ({
  row,
}: {
  row: Row<DataTableFeatures, InterviewRow>;
}) => {
  const intl = useAppIntl();

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
              aria-label={intl.formatMessage(messages.openMenu)}
              icon={<MoreHorizontal />}
              size="sm"
            />
          }
          nativeButton
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {intl.formatMessage(messages.actions)}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              icon={<DeleteIcon />}
            >
              {intl.formatMessage(commonMessages.delete)}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport(row.original)}
              icon={<FileIcon />}
            >
              {intl.formatMessage(messages.export)}
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
              {intl.formatMessage(messages.enterInterview)}
            </DropdownMenuItem>
          </a>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
