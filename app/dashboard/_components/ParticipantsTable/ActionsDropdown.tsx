'use client';

import type { Row } from '@tanstack/react-table';
import { useLiveQuery } from 'dexie-react-hooks';
import { MoreHorizontal, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { SelectProtocolDialog } from '~/components/offline/SelectProtocolDialog';
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
import useNetworkStatus from '~/hooks/useNetworkStatus';
import type { Participant } from '~/lib/db/generated/client';
import { offlineDb } from '~/lib/offline/db';
import { createOfflineInterview } from '~/lib/offline/offlineInterviewManager';
import type { ParticipantWithInterviews } from './ParticipantsTableClient';

export const ActionsDropdown = ({
  row,
  data,
  deleteHandler,
}: {
  row: Row<ParticipantWithInterviews>;
  data: ParticipantWithInterviews[];
  deleteHandler: (participant: ParticipantWithInterviews) => void;
}) => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { add: addToast } = useToast();
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showSelectProtocolDialog, setShowSelectProtocolDialog] =
    useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const cachedProtocols = useLiveQuery(
    async () => {
      return offlineDb.protocols.toArray();
    },
    [],
    [],
  );

  const editParticipant = (data: Participant) => {
    setSelectedParticipant(data);
    setShowParticipantModal(true);
  };

  const handleStartInterview = async () => {
    const protocols = cachedProtocols ?? [];

    if (!isOnline) {
      if (protocols.length === 0) {
        addToast({
          title: 'No Offline Protocols',
          description:
            'No protocols are available offline. Please download a protocol first.',
          type: 'info',
        });
        return;
      }

      if (protocols.length === 1) {
        // Only one protocol - start directly
        setIsStartingInterview(true);
        try {
          const result = await createOfflineInterview(
            protocols[0]!.id,
            row.original.identifier,
          );
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

      // Multiple protocols - show selection dialog
      setShowSelectProtocolDialog(true);
      return;
    }

    // Online - show protocol selection or redirect to onboard
    if (protocols.length > 0) {
      setShowSelectProtocolDialog(true);
    } else {
      addToast({
        title: 'No Protocols',
        description:
          'Please download a protocol for offline use from the Protocols page.',
        type: 'info',
      });
    }
  };

  return (
    <>
      <ParticipantModal
        open={showParticipantModal}
        setOpen={setShowParticipantModal}
        existingParticipants={data}
        editingParticipant={selectedParticipant}
        setEditingParticipant={setSelectedParticipant}
      />
      <SelectProtocolDialog
        open={showSelectProtocolDialog}
        onOpenChange={setShowSelectProtocolDialog}
        participantIdentifier={row.original.identifier}
        participantLabel={row.original.label}
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
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleStartInterview}
              disabled={isStartingInterview}
            >
              <Play className="mr-2 size-4" />
              {isStartingInterview ? 'Starting...' : 'Start Interview'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editParticipant(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteHandler(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
