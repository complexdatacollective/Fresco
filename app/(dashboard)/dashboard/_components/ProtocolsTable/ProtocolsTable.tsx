'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocolsDialog } from '~/app/(dashboard)/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';
import ImportProtocolModal from '~/app/(dashboard)/dashboard/protocols/_components/ImportProtocolModal';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/ProtocolsTable/ActionsDropdown';
export const ProtocolsTable = ({
  initialData,
}: {
  initialData: ProtocolWithInterviews[];
}) => {
  const { isLoading, data: protocols } = api.protocol.get.all.useQuery(
    undefined,
    {
      initialData,
      refetchOnMount: false,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
      },
    },
  );

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const utils = api.useUtils();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  const handleUploaded = () => {
    void utils.protocol.get.all.refetch();
  };

  return (
    <>
      {isLoading && <div>Loading...</div>}
      <ImportProtocolModal onProtocolUploaded={handleUploaded} />
      <DataTable
        columns={ProtocolColumns()}
        data={protocols}
        filterColumnAccessorKey="name"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete || []}
      />
    </>
  );
};
