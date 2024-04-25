'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { getParticipantColumns } from '~/app/dashboard/_components/ParticipantsTable/Columns';
import type { ParticipantWithInterviews } from '~/types/types';
import { ActionsDropdown } from '~/app/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { use, useCallback, useMemo, useState } from 'react';
import { DeleteParticipantsDialog } from '~/app/dashboard/participants/_components/DeleteParticipantsDialog';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '~/components/ui/Button';
import { Trash } from 'lucide-react';
import {
  deleteAllParticipants,
  deleteParticipants,
} from '~/actions/participants';
import AddParticipantButton from '../../participants/_components/AddParticipantButton';
import { GenerateParticipantURLs } from '../../participants/_components/ExportParticipants/GenerateParticipantURLsButton';
import { type getParticipants } from '~/queries/participants';

export const ParticipantsTableClient = ({
  participantsPromise,
}: {
  participantsPromise: ReturnType<typeof getParticipants>;
}) => {
  const participants = use(participantsPromise);

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<ParticipantWithInterviews, unknown>[]>(
    () => getParticipantColumns(),
    [],
  );

  const [participantsToDelete, setParticipantsToDelete] = useState<
    ParticipantWithInterviews[] | null
  >(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Actual delete handler, which handles optimistic updates, etc.
  const doDelete = async () => {
    if (!participantsToDelete) {
      return;
    }

    // Check if we are deleting all and call the appropriate function
    if (participantsToDelete.length === participants.length) {
      await deleteAllParticipants();
      return;
    }

    await deleteParticipants(participantsToDelete.map((p) => p.identifier));
  };

  // Resets the state when the dialog is closed.
  const resetDelete = () => {
    setShowDeleteModal(false);
    setParticipantsToDelete(null);
  };

  const handleDeleteItems = useCallback(
    (items: ParticipantWithInterviews[]) => {
      // Set state to the items to be deleted
      setParticipantsToDelete(items);

      // Show the dialog
      setShowDeleteModal(true);
    },
    [],
  );

  const handleDeleteAll = useCallback(() => {
    // Set state to all items
    setParticipantsToDelete(participants);

    // Show the dialog
    setShowDeleteModal(true);
  }, [participants]);

  return (
    <>
      <DeleteParticipantsDialog
        open={showDeleteModal}
        participantCount={participantsToDelete?.length ?? 0}
        haveInterviews={
          !!participantsToDelete?.some(
            (participant) => participant._count.interviews > 0,
          )
        }
        haveUnexportedInterviews={
          !!participantsToDelete?.some((participant) =>
            participant.interviews.some((interview) => !interview.exportTime),
          )
        }
        onConfirm={doDelete}
        onCancel={resetDelete}
      />
      <DataTable
        columns={columns}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDeleteItems}
        actions={ActionsDropdown}
        headerItems={
          <>
            <div className="flex flex-1 justify-start gap-2">
              <AddParticipantButton existingParticipants={participants} />
              <GenerateParticipantURLs
                participants={participants}
                protocols={[]}
              />
            </div>
            <Button variant="destructive" onClick={handleDeleteAll}>
              <Trash className="mr-2 inline-block h-4 w-4" />
              Delete All
            </Button>
          </>
        }
      />
    </>
  );
};
