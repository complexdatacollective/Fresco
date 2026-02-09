'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { use, useCallback, useMemo, useState } from 'react';
import SuperJSON from 'superjson';
import {
  deleteAllParticipants,
  deleteParticipants,
} from '~/actions/participants';
import { ActionsDropdown } from '~/app/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { getParticipantColumns } from '~/app/dashboard/_components/ParticipantsTable/Columns';
import { DeleteParticipantsDialog } from '~/app/dashboard/participants/_components/DeleteParticipantsDialog';
import { DataTable } from '~/components/DataTable/DataTable';
import { DialogTrigger } from '~/lib/dialogs/DialogTrigger';
import type {
  GetParticipantsQuery,
  GetParticipantsReturnType,
} from '~/queries/participants';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import AddParticipantButton from '../../participants/_components/AddParticipantButton';
import { GenerateParticipantURLs } from '../../participants/_components/ExportParticipants/GenerateParticipantURLsButton';

export type ParticipantWithInterviews = GetParticipantsQuery[number];

export const ParticipantsTableClient = ({
  participantsPromise,
  protocolsPromise,
}: {
  participantsPromise: GetParticipantsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const rawParticipants = use(participantsPromise);
  const rawProtocols = use(protocolsPromise);
  const participants = SuperJSON.parse<GetParticipantsQuery>(rawParticipants);
  const protocols = SuperJSON.parse<GetProtocolsQuery>(rawProtocols);

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<ParticipantWithInterviews, unknown>[]>(
    () => getParticipantColumns(protocols),
    [protocols],
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
      resetDelete();
      return;
    }

    await deleteParticipants(participantsToDelete.map((p) => p.id));

    resetDelete();
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
            <AddParticipantButton existingParticipants={participants} />
            <GenerateParticipantURLs
              participants={participants}
              protocols={protocols}
            />
            <DialogTrigger
              color="destructive"
              icon={<Trash />}
              dialog={{
                type: 'choice',
                intent: 'destructive',
                title: 'Delete All Participants?',
                description:
                  'Are you sure you want to delete all participants? This action cannot be undone.',
                actions: {
                  primary: { label: 'Delete All', value: true },
                  cancel: { label: 'Cancel', value: false },
                },
              }}
              onResult={(result) => {
                if (result) {
                  handleDeleteAll();
                }
              }}
              className="tablet:w-auto w-full"
            >
              Delete All
            </DialogTrigger>
          </>
        }
      />
    </>
  );
};
