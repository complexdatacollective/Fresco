'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { use, useCallback, useMemo, useRef, useState } from 'react';
import SuperJSON from 'superjson';
import {
  deleteAllParticipants,
  deleteParticipants,
} from '~/actions/participants';
import { ActionsDropdown } from '~/app/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { getParticipantColumns } from '~/app/dashboard/_components/ParticipantsTable/Columns';
import { DeleteParticipantsDialog } from '~/app/dashboard/participants/_components/DeleteParticipantsDialog';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { DataTable } from '~/components/DataTable/DataTable';
import { DataTableFloatingBar } from '~/components/DataTable/DataTableFloatingBar';
import { DataTableToolbar } from '~/components/DataTable/DataTableToolbar';
import { Button } from '~/components/ui/Button';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import type { Participant } from '~/lib/db/generated/client';
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

// Memoize SuperJSON.parse results to maintain stable references across
// re-renders. Without this, every table state change (sort, filter, select)
// causes column definitions to be recreated, forcing TanStack Table to
// rebuild its entire row model and re-render all cells.
function useStableParse<T>(raw: string): T {
  const ref = useRef<{ raw: string; parsed: T } | null>(null);
  if (ref.current?.raw !== raw) {
    ref.current = { raw, parsed: SuperJSON.parse<T>(raw) };
  }
  return ref.current.parsed;
}

export const ParticipantsTableClient = ({
  participantsPromise,
  protocolsPromise,
}: {
  participantsPromise: GetParticipantsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.
  'use no memo';
  const rawParticipants = use(participantsPromise);
  const rawProtocols = use(protocolsPromise);
  const participants = useStableParse<GetParticipantsQuery>(rawParticipants);
  const protocols = useStableParse<GetProtocolsQuery>(rawProtocols);

  const [participantsToDelete, setParticipantsToDelete] = useState<
    ParticipantWithInterviews[] | null
  >(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const doDelete = async () => {
    if (!participantsToDelete) {
      return;
    }

    if (participantsToDelete.length === participants.length) {
      await deleteAllParticipants();
      resetDelete();
      return;
    }

    await deleteParticipants(participantsToDelete.map((p) => p.id));

    resetDelete();
  };

  const resetDelete = () => {
    setShowDeleteModal(false);
    setParticipantsToDelete(null);
  };

  const handleDeleteItems = useCallback(
    (items: ParticipantWithInterviews[]) => {
      setParticipantsToDelete(items);
      setShowDeleteModal(true);
    },
    [],
  );

  const handleDeleteAll = useCallback(() => {
    setParticipantsToDelete(participants);
    setShowDeleteModal(true);
  }, [participants]);

  const handleEditParticipant = useCallback(
    (participant: ParticipantWithInterviews) => {
      setEditingParticipant(participant);
      setShowEditModal(true);
    },
    [],
  );

  const handleDeleteSingle = useCallback(
    (participant: ParticipantWithInterviews) => {
      handleDeleteItems([participant]);
    },
    [handleDeleteItems],
  );

  const columns = useMemo<ColumnDef<ParticipantWithInterviews, unknown>[]>(
    () => [
      ...getParticipantColumns(protocols),
      {
        id: 'actions',
        cell: ({ row }: { row: Row<ParticipantWithInterviews> }) => (
          <ActionsDropdown
            row={row}
            onEdit={handleEditParticipant}
            onDelete={handleDeleteSingle}
          />
        ),
      },
    ],
    [protocols, handleEditParticipant, handleDeleteSingle],
  );

  const { table } = useClientDataTable({
    data: participants,
    columns,
  });

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
      <ParticipantModal
        open={showEditModal}
        setOpen={setShowEditModal}
        existingParticipants={participants}
        editingParticipant={editingParticipant}
        setEditingParticipant={setEditingParticipant}
      />
      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            searchableColumns={[{ id: 'identifier', title: 'by identifier' }]}
          >
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
          </DataTableToolbar>
        }
        floatingBar={
          <DataTableFloatingBar table={table}>
            <Button
              onClick={() =>
                handleDeleteItems(
                  table.getSelectedRowModel().rows.map((r) => r.original),
                )
              }
              color="destructive"
              icon={<Trash className="size-4" />}
            >
              Delete Selected
            </Button>
          </DataTableFloatingBar>
        }
      />
    </>
  );
};
