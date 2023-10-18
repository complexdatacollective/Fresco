import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from './Columns';
import { trpc } from '~/app/_trpc/server';

export const ProtocolsTable = async () => {
  try {
    const protocols = await trpc.protocol.get.all.query(undefined, {
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
  } catch (error) {
    throw new Error('An error occurred while fetching protocols');
  }
};
