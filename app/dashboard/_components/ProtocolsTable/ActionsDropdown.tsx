'use client';

import type { Row } from '@tanstack/react-table';
import { Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { IconButton } from '@codaco/fresco-ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/dropdown-menu';
import { useToast } from '@codaco/fresco-ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

export const ActionsDropdown = ({
  row,
}: {
  row: Row<ProtocolWithInterviews>;
}) => {
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
      throw new Error('Failed to download protocol file');
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
            {row.original.originalFileUrl && (
              <DropdownMenuItem
                onClick={() =>
                  void promise(handleDownload(), {
                    loading: 'Downloading protocol...',
                    success: 'Protocol downloaded!',
                    error: 'Failed to download protocol.',
                  })
                }
                icon={<Download />}
              >
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              icon={<Trash2 />}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
