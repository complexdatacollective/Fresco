'use client';

import { use, useState } from 'react';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { DataTable } from '~/components/DataTable/DataTable';
import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import type { ProtocolWithInterviews } from '~/types/types';
import ProtocolUploader from '../ProtocolUploader';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { type GetData } from './ProtocolsTable';

const ProtocolsTableClient = ({ dataPromise }: { dataPromise: GetData }) => {
  const [protocols, allowAnonymousRecruitment, hasUploadThingToken] =
    use(dataPromise);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  return (
    <>
      {!hasUploadThingToken && (
        <Alert variant="info" className="mb-4">
          <AlertTitle>Configuration update required</AlertTitle>
          <AlertDescription>
            You need to add a new UploadThing API key before you can upload
            protocols. Visit the{' '}
            <Link href="/dashboard/settings">settings page</Link>.
          </AlertDescription>
        </Alert>
      )}
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
