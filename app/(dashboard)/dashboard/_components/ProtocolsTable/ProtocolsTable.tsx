import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from './Columns';
import { api } from '~/trpc/server';

export const ProtocolsTable = async () => {
  const protocols = await api.protocol.get.all.query(undefined, {
    context: {
      revalidate: 0,
    },
  });

  return (
    <DataTable
      columns={ProtocolColumns}
      data={protocols}
      filterColumnAccessorKey="name"
    />
  );
};
