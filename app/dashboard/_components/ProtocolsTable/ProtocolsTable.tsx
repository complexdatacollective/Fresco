'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';
import ProtocolUploader from '../ProtocolUploader';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';

export const ProtocolsTable = () => {
  const { data: protocols } = api.protocol.get.all.useQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });

  const { data: appSettings } = api.appSettings.get.useQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });

  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  if (!protocols) {
    return <DataTableSkeleton columnCount={getProtocolColumns().length} />;
  }

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
