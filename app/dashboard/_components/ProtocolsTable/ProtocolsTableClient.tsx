'use client';

import { use, useState } from 'react';
import SuperJSON from 'superjson';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { DataTable } from '~/components/DataTable/DataTable';
import type { GetProtocolsQuery } from '~/queries/protocols';
import ProtocolUploader from '../ProtocolUploader';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { type GetData } from './ProtocolsTable';

export type ProtocolWithInterviews = GetProtocolsQuery[number];

const ProtocolsTableClient = ({ dataPromise }: { dataPromise: GetData }) => {
  const [rawProtocols, allowAnonymousRecruitment, hasUploadThingToken] =
    use(dataPromise);
  const protocols = SuperJSON.parse<GetProtocolsQuery>(rawProtocols);

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
