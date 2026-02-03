'use client';

import type { Row } from '@tanstack/react-table';
import { useLiveQuery } from 'dexie-react-hooks';
import { MoreHorizontal, Download, Play, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { StartOfflineInterviewDialog } from '~/components/offline/StartOfflineInterviewDialog';
import { IconButton } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import Dialog from '~/lib/dialogs/Dialog';
import { ProtocolDownloadProgress } from '~/components/offline/ProtocolDownloadProgress';
import useNetworkStatus from '~/hooks/useNetworkStatus';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';
import { getProtocolById, setProtocolOfflineStatus } from '~/actions/protocols';
import {
  assetDownloadManager,
  type DownloadProgress,
  type ProtocolWithAssets,
} from '~/lib/offline/assetDownloadManager';
import { offlineDb } from '~/lib/offline/db';
import { createOfflineInterview } from '~/lib/offline/offlineInterviewManager';

export const ActionsDropdown = ({
  row,
}: {
  row: Row<ProtocolWithInterviews>;
}) => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [protocolToDelete, setProtocolToDelete] =
    useState<ProtocolWithInterviews[]>();
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [showStartInterviewDialog, setShowStartInterviewDialog] =
    useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const { add: addToast } = useToast();

  const isCached = useLiveQuery(
    async () => {
      const cached = await offlineDb.protocols.get(row.original.id);
      return !!cached;
    },
    [row.original.id],
    false,
  );

  const handleDelete = (data: ProtocolWithInterviews) => {
    setProtocolToDelete([data]);
    setShowDeleteModal(true);
  };

  const handleEnableOffline = async () => {
    try {
      const quota = await assetDownloadManager.checkStorageQuota();

      if (quota.percentUsed > 95) {
        addToast({
          title: 'Storage Full',
          description:
            'Not enough storage space available. Please free up space and try again.',
          type: 'destructive',
        });
        return;
      }

      if (quota.percentUsed > 80) {
        addToast({
          title: 'Storage Warning',
          description: `Storage is ${Math.round(quota.percentUsed)}% full. Download may fail if storage runs out.`,
          type: 'info',
        });
      }

      const protocol = await getProtocolById(row.original.id);

      if (!protocol) {
        addToast({
          title: 'Error',
          description: 'Protocol not found',
          type: 'destructive',
        });
        return;
      }

      setShowDownloadProgress(true);

      await offlineDb.protocols.put({
        id: protocol.id,
        name: protocol.name,
        cachedAt: Date.now(),
        data: JSON.stringify({
          ...protocol,
          assets: undefined,
        }),
      });

      const result = await assetDownloadManager.downloadProtocolAssets(
        protocol as ProtocolWithAssets,
        (progress) => {
          setDownloadProgress(progress);
        },
      );

      if (result.success) {
        await setProtocolOfflineStatus(protocol.id, true);

        addToast({
          title: 'Success',
          description: `Protocol "${protocol.name}" is now available offline`,
          type: 'success',
        });

        setShowDownloadProgress(false);
        setDownloadProgress(null);
      } else {
        await offlineDb.protocols.delete(protocol.id);

        addToast({
          title: 'Download Failed',
          description: result.error ?? 'Failed to download protocol assets',
          type: 'destructive',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'destructive',
      });
    }
  };

  const handleCancelDownload = () => {
    assetDownloadManager.pauseDownload();
    setShowDownloadProgress(false);
    setDownloadProgress(null);
  };

  const handleStartInterview = async () => {
    if (!isOnline && !isCached) {
      setShowStartInterviewDialog(true);
      return;
    }

    if (!isOnline && isCached) {
      setIsStartingInterview(true);
      try {
        const result = await createOfflineInterview(row.original.id);
        if (result.error) {
          addToast({
            title: 'Error',
            description: result.error,
            type: 'destructive',
          });
          return;
        }
        router.push(`/interview/${result.interviewId}`);
      } catch (error) {
        addToast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to start interview',
          type: 'destructive',
        });
      } finally {
        setIsStartingInterview(false);
      }
      return;
    }

    // Online - use the standard interview creation flow via onboard
    router.push(`/onboard/${row.original.id}`);
  };

  return (
    <>
      <DeleteProtocolsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        protocolsToDelete={protocolToDelete ?? []}
      />
      <Dialog
        open={showDownloadProgress}
        closeDialog={() => setShowDownloadProgress(false)}
        title="Downloading Protocol Assets"
        description="Please wait while we download all protocol assets for offline use."
      >
        {downloadProgress && (
          <ProtocolDownloadProgress
            progress={downloadProgress}
            onCancel={handleCancelDownload}
          />
        )}
      </Dialog>
      <StartOfflineInterviewDialog
        open={showStartInterviewDialog}
        onOpenChange={setShowStartInterviewDialog}
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
              onClick={handleStartInterview}
              disabled={isStartingInterview || (!isOnline && !isCached)}
            >
              <Play className="mr-2 size-4" />
              {isStartingInterview ? 'Starting...' : 'Start Interview'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isCached ? (
              <DropdownMenuItem disabled>
                <Check className="mr-2 size-4" />
                Available Offline
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleEnableOffline}
                disabled={!isOnline}
              >
                <Download className="mr-2 size-4" />
                Enable Offline
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
