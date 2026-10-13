'use client';

import type { Row } from '@tanstack/react-table';
import { Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { AppMessage, useAppIntl } from '@codaco/app-i18n/react';
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
import { useToast } from '@codaco/fresco-ui/Toast';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useDownload } from '~/hooks/useDownload';

import type { ProtocolWithInterviews } from './ProtocolsTableClient';

const messages = defineMessages({
  copyFailedToDownloadProtocolFile: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.copyFailedToDownloadProtocolFile',
    defaultMessage: 'Failed to download protocol file',
    description:
      'Researcher-facing ProtocolsTable / ActionsDropdown: Failed to download protocol file',
  },
  copyDownloadingProtocol: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.copyDownloadingProtocol',
    defaultMessage: 'Downloading protocol...',
    description:
      'Researcher-facing ProtocolsTable / ActionsDropdown: Downloading protocol...',
  },
  copyProtocolDownloaded: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.copyProtocolDownloaded',
    defaultMessage: 'Protocol downloaded!',
    description:
      'Researcher-facing ProtocolsTable / ActionsDropdown: Protocol downloaded!',
  },
  openMenu: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.openMenu',
    defaultMessage: 'Open menu',
    description:
      'Researcher-facing ProtocolsTable / ActionsDropdown: Open menu',
  },
  actions: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.actions',
    defaultMessage: 'Actions',
    description: 'Researcher-facing ProtocolsTable / ActionsDropdown: Actions',
  },
  failedToDownloadProtocol: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.failedToDownloadProtocol',
    defaultMessage: 'Failed to download protocol.',
    description:
      'Researcher-facing ProtocolsTable / ActionsDropdown: Failed to download protocol.',
  },
  download: {
    id: 'fresco.ProtocolsTable.ActionsDropdown.download',
    defaultMessage: 'Download',
    description: 'Researcher-facing ProtocolsTable / ActionsDropdown: Download',
  },
});

const downloadToastMessages = {
  loading: {
    description: <AppMessage message={messages.copyDownloadingProtocol} />,
  },
  success: {
    description: <AppMessage message={messages.copyProtocolDownloaded} />,
  },
  error: {
    description: <AppMessage message={messages.failedToDownloadProtocol} />,
  },
};

export const ActionsDropdown = ({
  row,
}: {
  row: Row<DataTableFeatures, ProtocolWithInterviews>;
}) => {
  const intl = useAppIntl();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [protocolToDelete, setProtocolToDelete] =
    useState<ProtocolWithInterviews[]>();
  const { promise } = useToast();
  const download = useDownload();

  const handleDelete = (data: ProtocolWithInterviews) => {
    setProtocolToDelete([data]);
    setShowDeleteModal(true);
  };

  const handleDownload = async () => {
    const { originalFileUrl, name } = row.original;
    if (!originalFileUrl) return;

    const response = await fetch(originalFileUrl);
    if (!response.ok) {
      throw new Error(
        intl.formatMessage(messages.copyFailedToDownloadProtocolFile),
      );
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    download(blobUrl, name);
    URL.revokeObjectURL(blobUrl);
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
            {row.original.originalFileUrl && (
              <DropdownMenuItem
                onClick={() =>
                  void promise(handleDownload(), downloadToastMessages)
                }
                icon={<Download />}
              >
                {intl.formatMessage(messages.download)}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              icon={<Trash2 />}
            >
              {intl.formatMessage(commonMessages.delete)}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
