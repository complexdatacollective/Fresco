'use client';

import {
  type ColumnDef,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';
import { FileUp } from 'lucide-react';
import { use, useMemo, useState, useTransition } from 'react';
import SuperJSON from 'superjson';
import {
  deleteParticipants,
  getParticipantDeletionInfo,
  getParticipantsForExport,
  resolveParticipantIds,
} from '~/actions/participants';
import { ActionsDropdown } from '~/app/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { getParticipantColumns } from '~/app/dashboard/_components/ParticipantsTable/Columns';
import AddParticipantButton from '~/app/dashboard/participants/_components/AddParticipantButton';
import { DeleteParticipantsDialog } from '~/app/dashboard/participants/_components/DeleteParticipantsDialog';
import { useExportParticipants } from '~/app/dashboard/participants/_components/ExportParticipants/ExportParticipants';
import ImportParticipants from '~/app/dashboard/participants/_components/ImportParticipants';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { Button } from '@codaco/fresco-ui/Button';
import { cx } from '@codaco/fresco-ui/utils/cva';
import { useToast } from '@codaco/fresco-ui/Toast';
import NuqsClearFilters from '~/components/DataTable/nuqs/NuqsClearFilters';
import NuqsSearchFilter from '~/components/DataTable/nuqs/NuqsSearchFilter';
import {
  NuqsTableProvider,
  useNuqsTable,
} from '~/components/DataTable/nuqs/NuqsTableProvider';
import type { Participant } from '~/lib/db/generated/client';
import type {
  GetParticipantsForSelectQuery,
  GetParticipantsForSelectReturnType,
  GetParticipantsQuery,
  GetParticipantsReturnType,
} from '~/queries/participants';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import ParticipantsTableRows from './ParticipantsTableRows';
import {
  PARTICIPANTS_PREFIX,
  type ParticipantsSearchParams,
} from './searchParams';

const clearableFilters = ['q'] as const;

export type ParticipantRow = GetParticipantsQuery[number];

type ParticipantsTableProps = {
  participantsPromise: GetParticipantsReturnType;
  allParticipantsPromise: GetParticipantsForSelectReturnType;
  protocolsPromise: GetProtocolsReturnType;
  searchParams: ParticipantsSearchParams;
};

export const ParticipantsTableClient = (props: ParticipantsTableProps) => {
  return (
    <NuqsTableProvider prefix={PARTICIPANTS_PREFIX}>
      <ParticipantsTableInner {...props} />
    </NuqsTableProvider>
  );
};

const ParticipantsTableInner = ({
  participantsPromise,
  allParticipantsPromise,
  protocolsPromise,
  searchParams,
}: ParticipantsTableProps) => {
  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.
  'use no memo';
  const { isPending } = useNuqsTable();
  const { add } = useToast();
  const rawAllParticipants = use(allParticipantsPromise);
  const rawProtocols = use(protocolsPromise);
  const allParticipants = useMemo(
    () => SuperJSON.parse<GetParticipantsForSelectQuery>(rawAllParticipants),
    [rawAllParticipants],
  );
  const protocols = useMemo(
    () => SuperJSON.parse<GetProtocolsQuery>(rawProtocols),
    [rawProtocols],
  );

  const exportParticipants = useExportParticipants(protocols);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteHaveInterviews, setDeleteHaveInterviews] = useState(false);
  const [deleteHaveUnexported, setDeleteHaveUnexported] = useState(false);

  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isSelecting, startSelecting] = useTransition();
  const [isDeleteResolving, startDeleteResolving] = useTransition();
  const [isExportResolving, startExportResolving] = useTransition();

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );

  const handleEditParticipant = useMemo(
    () => (participant: ParticipantRow) => {
      const existing = allParticipants.find((p) => p.id === participant.id);
      if (!existing) return;
      setEditingParticipant(existing);
      setShowEditModal(true);
    },
    [allParticipants],
  );

  const openDeleteDialog = (
    ids: string[],
    haveInterviews: boolean,
    haveUnexported: boolean,
  ) => {
    setDeleteIds(ids);
    setDeleteHaveInterviews(haveInterviews);
    setDeleteHaveUnexported(haveUnexported);
    setShowDeleteModal(true);
  };

  const handleDeleteSingle = useMemo(
    () => (participant: ParticipantRow) => {
      openDeleteDialog(
        [participant.id],
        participant._count.interviews > 0,
        participant.interviews.some((interview) => !interview.exportTime),
      );
    },
    [],
  );

  const columns = useMemo<ColumnDef<ParticipantRow, unknown>[]>(
    () => [
      ...getParticipantColumns(protocols),
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }: { row: Row<ParticipantRow> }) => (
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

  const handleDeleteSelected = () => {
    startDeleteResolving(async () => {
      const result = await getParticipantDeletionInfo(selectedIds);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      openDeleteDialog(
        result.data.map((p) => p.id),
        result.data.some((p) => p.hasInterviews),
        result.data.some((p) => p.hasUnexportedInterviews),
      );
    });
  };

  const doDelete = async () => {
    await deleteParticipants(deleteIds);
    setRowSelection({});
    resetDelete();
  };

  const resetDelete = () => {
    setShowDeleteModal(false);
    setDeleteIds([]);
    setDeleteHaveInterviews(false);
    setDeleteHaveUnexported(false);
  };

  const resolveAndExport = (ids: string[]) => {
    startExportResolving(async () => {
      const result = await getParticipantsForExport(ids);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      exportParticipants(result.data);
    });
  };

  const handleExportSelected = () => {
    resolveAndExport(selectedIds);
  };

  const handleExportAll = () => {
    startExportResolving(async () => {
      const idsResult = await resolveParticipantIds(searchParams);
      if (idsResult.error) {
        add({
          title: 'Error',
          description: idsResult.error,
          variant: 'destructive',
        });
        return;
      }
      const result = await getParticipantsForExport(idsResult.ids);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      exportParticipants(result.data);
    });
  };

  const handleSelectAllMatching = () => {
    startSelecting(async () => {
      const result = await resolveParticipantIds(searchParams);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setRowSelection(Object.fromEntries(result.ids.map((id) => [id, true])));
    });
  };

  const handleDeselectAll = () => {
    setRowSelection({});
  };

  return (
    <>
      <DeleteParticipantsDialog
        open={showDeleteModal}
        participantCount={deleteIds.length}
        haveInterviews={deleteHaveInterviews}
        haveUnexportedInterviews={deleteHaveUnexported}
        onConfirm={doDelete}
        onCancel={resetDelete}
      />
      <ParticipantModal
        open={showEditModal}
        setOpen={setShowEditModal}
        existingParticipants={allParticipants}
        editingParticipant={editingParticipant}
        setEditingParticipant={setEditingParticipant}
      />
      <div
        className={cx(
          'transition-opacity duration-150',
          isPending && 'pointer-events-none opacity-60',
        )}
        aria-busy={isPending}
      >
        <ParticipantsTableRows
          participantsPromise={participantsPromise}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          columns={columns}
          isBusy={isSelecting || isDeleteResolving || isExportResolving}
          onDeleteSelected={handleDeleteSelected}
          onExportSelected={handleExportSelected}
          onSelectAllMatching={handleSelectAllMatching}
          onDeselectAll={handleDeselectAll}
          toolbar={
            <Toolbar
              existingParticipants={allParticipants}
              isExportResolving={isExportResolving}
              onExportAll={handleExportAll}
            />
          }
        />
      </div>
    </>
  );
};

const Toolbar = ({
  existingParticipants,
  isExportResolving,
  onExportAll,
}: {
  existingParticipants: GetParticipantsForSelectQuery;
  isExportResolving: boolean;
  onExportAll: () => void;
}) => {
  return (
    <div className="tablet-landscape:flex-row tablet-landscape:flex-wrap flex w-full flex-col items-center gap-2">
      <NuqsSearchFilter paramKey="q" placeholder="Filter by identifier..." />
      <AddParticipantButton existingParticipants={existingParticipants} />
      <ImportParticipants />
      <Button
        onClick={onExportAll}
        disabled={isExportResolving}
        icon={<FileUp />}
        data-testid="export-participants-button"
      >
        Export Participants
      </Button>
      <NuqsClearFilters paramKeys={clearableFilters} />
    </div>
  );
};
