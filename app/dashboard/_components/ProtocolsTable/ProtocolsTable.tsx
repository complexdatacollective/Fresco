'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';
import ProtocolUploader from '../ProtocolUploader';

export const ProtocolsTable = ({
  initialData,
  allowAnonymousRecruitment = false,
}: {
  initialData: ProtocolWithInterviews[];
  allowAnonymousRecruitment: boolean;
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
      <DataTable
        columns={getProtocolColumns(allowAnonymousRecruitment)}
        data={protocols}
        filterColumnAccessorKey="name"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
        headerItems={<ProtocolUploader />}
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete ?? []}
      />
    </>
  );
};
