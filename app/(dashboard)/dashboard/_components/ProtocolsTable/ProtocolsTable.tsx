'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from './Columns';
import { trpc } from '~/app/_trpc/client';
import { type Protocol } from '@prisma/client';

export const ProtocolsTable = ({
  initialData,
}: {
  initialData: Protocol[];
}) => {
  const { mutateAsync: deleteProtocols } =
    trpc.protocol.delete.byHash.useMutation();
  const {
    isLoading,
    refetch,
    data: protocols,
  } = trpc.protocol.get.all.useQuery(undefined, {
    initialData,
    refetchOnMount: false,
    onError(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

  const handleDelete = async (data: Protocol[]) => {
    await deleteProtocols(data.map((d) => d.hash));
    await refetch();
  };

  return (
    <DataTable
      columns={ProtocolColumns(handleDelete)}
      data={protocols}
      filterColumnAccessorKey="name"
      handleDeleteSelected={handleDelete}
    />
  );
};
