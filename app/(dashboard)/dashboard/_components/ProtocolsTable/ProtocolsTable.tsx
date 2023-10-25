'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from './Columns';
import { api } from '~/trpc/client';
import { DeleteProtocol } from '~/app/(dashboard)/dashboard/_components/ProtocolsTable/DeleteProtocols';
import { useState } from 'react';
import type { ProtocolWithInterviews } from '~/shared/types';
import ImportProtocolModal from '~/app/(dashboard)/dashboard/protocols/_components/ImportProtocolModal';
import { Settings } from 'lucide-react';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
export const ProtocolsTable = ({
  initialData,
}: {
  initialData: ProtocolWithInterviews[];
}) => {
  const { mutateAsync: deleteProtocols, isLoading: isDeleting } =
    api.protocol.delete.byHash.useMutation();
  const {
    isLoading,
    refetch,
    data: protocols,
  } = api.protocol.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onError(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [deleteProtocolsInfo, setDeleteProtocolsInfo] = useState<{
    protocolsToDelete: ProtocolWithInterviews[];
    hasInterviews: boolean;
    hasUnexportedInterviews: boolean;
  }>({
    protocolsToDelete: [],
    hasInterviews: false,
    hasUnexportedInterviews: false,
  });

  const utils = api.useUtils();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setDeleteProtocolsInfo({
      protocolsToDelete: data,
      hasInterviews: data.some((protocol) => protocol.interviews.length > 0),
      hasUnexportedInterviews: data.some((protocol) =>
        protocol.interviews.some((interview) => !interview.exportTime),
      ),
    });
    setShowAlertDialog(true);
  };

  const handleConfirm = async () => {
    await deleteProtocols(
      deleteProtocolsInfo.protocolsToDelete.map((d) => d.hash),
    );
    await refetch();
    setShowAlertDialog(false);
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
        actions={[
          {
            id: 'actions',
            header: () => <Settings />,
            cell: ({ row }) => {
              return (
                <ActionsDropdown
                  menuItems={[
                    {
                      label: 'Delete',
                      row,
                      component: (
                        <DropdownMenuItem
                          onClick={() => void handleDelete([row.original])}
                        >
                          Delete
                        </DropdownMenuItem>
                      ),
                    },
                  ]}
                />
              );
            },
          },
        ]}
      />
      <DeleteProtocol
        open={showAlertDialog}
        onCancel={() => setShowAlertDialog(false)}
        onConfirm={handleConfirm}
        selectedProtocols={deleteProtocolsInfo.protocolsToDelete}
        isDeleting={isDeleting}
        hasInterviews={deleteProtocolsInfo.hasInterviews}
        hasUnexportedInterviews={deleteProtocolsInfo.hasUnexportedInterviews}
      />
    </>
  );
};
