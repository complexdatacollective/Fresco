'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ActionsDropdown } from './ActionsDropdown';
import { ProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocolsDialog } from '~/app/(dashboard)/dashboard/protocols/_components/DeleteProtocolsDialog';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';

export const ProtocolsTable = ({
  initialData,
}: {
  initialData: ProtocolWithInterviews[];
}) => {
  const { data: protocols, isLoading } = api.protocol.get.all.useQuery(
    undefined,
    {
      initialData,
      refetchOnMount: false,
      onError(error) {
        throw new Error(error.message, { cause: error });
      },
    },
  );

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  return (
    <>
      {isLoading && <div>Loading...</div>}
      <DataTable<ProtocolWithInterviews, string>
        columns={ProtocolColumns}
        data={protocols}
        filterColumnAccessorKey="name"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
        calculateRowClasses={(row) =>
          row.original.active
            ? 'bg-purple-500/30 hover:bg-purple-500/40'
            : undefined
        }
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete || []}
      />
    </>
  );
};
