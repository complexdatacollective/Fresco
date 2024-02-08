'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { getParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import type { ParticipantWithInterviews } from '~/shared/types';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ActionsDropdown';
import { DeleteAllParticipantsButton } from '~/app/(dashboard)/dashboard/participants/_components/DeleteAllParticipantsButton';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import { useCallback, useMemo, useState } from 'react';
import { DeleteParticipantsDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipantsDialog';
import ExportParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportParticipants';
import { api } from '~/trpc/client';
import { type RouterOutputs } from '~/trpc/shared';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { type ColumnDef } from '@tanstack/react-table';

export const ParticipantsTable = ({
  initialData,
}: {
  initialData: RouterOutputs['participant']['get']['all'];
}) => {
  const { data: participants, isLoading } = api.participant.get.all.useQuery(
    undefined,
    {
      initialData,
      refetchOnMount: false,
      onError(error) {
        throw new Error(error.message);
      },
    },
  );

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<ParticipantWithInterviews, unknown>[]>(
    () => getParticipantColumns(),
    [],
  );

  const [participantsToDelete, setParticipantsToDelete] =
    useState<ParticipantWithInterviews[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = useCallback((data: ParticipantWithInterviews[]) => {
    setParticipantsToDelete(data);
    setShowDeleteModal(true);
  }, []);

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        filterableColumnCount={1}
      />
    );
  }

  return (
    <>
      <DeleteParticipantsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        participantsToDelete={participantsToDelete ?? []}
      />
      <DataTable
        columns={columns}
        data={participants}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
        headerItems={
          <>
            <AddParticipantButton existingParticipants={participants} />
            <ImportCSVModal />
            <ExportParticipants participants={participants} />
            <DeleteAllParticipantsButton />
          </>
        }
      />
    </>
  );
};
