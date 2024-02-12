'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { getParticipantColumns } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/Columns';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import type { ParticipantWithInterviews } from '~/shared/types';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ActionsDropdown';
import AddParticipantButton from '~/app/(dashboard)/dashboard/participants/_components/AddParticipantButton';
import { useCallback, useMemo, useState } from 'react';
import { DeleteParticipantsDialog } from '~/app/(dashboard)/dashboard/participants/_components/DeleteParticipantsDialog';
import ExportParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportParticipants/ExportParticipants';
import { api } from '~/trpc/client';
import { type RouterOutputs } from '~/trpc/shared';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Trash } from 'lucide-react';
import { GenerateParticipationURLButton } from './GenerateParticipantURLButton';
import { GenerateParticipantURLs } from '../../participants/_components/ExportParticipants/ExportParticipantUrlSection';

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

  const utils = api.useUtils();
  const router = useRouter();

  const { mutateAsync: apiDeleteParticipants } =
    api.participant.delete.byId.useMutation({
      async onMutate(participantIds) {
        await utils.participant.get.all.cancel();

        // snapshot current participants
        const previousValue = utils.participant.get.all.getData();

        // Optimistically update to the new value
        const newValue = previousValue?.filter(
          (p) => !participantIds.includes(p.identifier),
        );

        utils.participant.get.all.setData(undefined, newValue);

        resetDelete(); // Will hide the modal

        return { previousValue };
      },
      onSuccess() {
        router.refresh();
      },
      onError(error, identifiers, context) {
        utils.participant.get.all.setData(undefined, context?.previousValue);
        throw new Error(error.message);
      },
      async onSettled() {
        await utils.participant.get.all.invalidate();
      },
    });

  const { mutateAsync: apiDeleteAllParticipants } =
    api.participant.delete.all.useMutation({
      async onMutate() {
        await utils.participant.get.all.cancel();
        const previousValue = utils.participant.get.all.getData();
        utils.participant.get.all.setData(undefined, []);
        resetDelete();
        return { previousValue };
      },
      onSuccess() {
        router.refresh();
      },
      onError(error, _, context) {
        utils.participant.get.all.setData(undefined, context?.previousValue);
        throw new Error(error.message);
      },
      async onSettled() {
        await utils.participant.get.all.invalidate();
      },
    });

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
      await apiDeleteAllParticipants();
      return;
    }

    await apiDeleteParticipants(participantsToDelete.map((p) => p.identifier));
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
              <GenerateParticipantURLs />
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
