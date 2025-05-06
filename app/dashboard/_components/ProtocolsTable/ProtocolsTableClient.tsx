'use client';

import { use, useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { DataTable } from '~/components/DataTable/DataTable';
import { type GetProtocolsReturnType } from '~/queries/protocols';
import ProtocolUploader from '../ProtocolUploader';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { type GetData } from './ProtocolsTable';

const ProtocolsTableClient = ({ dataPromise }: { dataPromise: GetData }) => {
  const [protocols, allowAnonymousRecruitment, hasUploadThingToken] =
    use(dataPromise);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<Awaited<GetProtocolsReturnType>[0][]>();

  const handleDelete = (data: Awaited<GetProtocolsReturnType>[0][]) => {
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
        headerItems={<ProtocolUploader buttonDisabled={!hasUploadThingToken} />}
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete ?? []}
      />
    </>
  );
};

export default ProtocolsTableClient;
