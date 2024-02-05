'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ActionsDropdown } from './ActionsDropdown';
import { ProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocolsDialog } from '~/app/(dashboard)/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';
import { ParticipationUrlModal } from '~/app/(dashboard)/dashboard/protocols/_components/ParticipationUrlModal';
import { AnonymousRecruitmentModal } from '../../protocols/_components/AnonymousRecruitmentModal';

export const ProtocolsTable = ({
  initialData,
}: {
  initialData: ProtocolWithInterviews[];
}) => {
  const { data: protocols } = api.protocol.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onError(error) {
      throw new Error(error.message);
    },
  });

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <ParticipationUrlModal />
        <AnonymousRecruitmentModal />
      </div>
      <DataTable<ProtocolWithInterviews, string>
        columns={ProtocolColumns}
        data={protocols}
        filterColumnAccessorKey="name"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete ?? []}
      />
    </>
  );
};
