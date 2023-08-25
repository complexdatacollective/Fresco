import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from '~/app/(main)/_components/ProtocolsTable/Columns';
import { safeLoadProtocols } from './Loader';

const protocols = await safeLoadProtocols();

export const ProtocolsTable = () => {
  return (
    <DataTable
      columns={ProtocolColumns}
      data={protocols}
      filterColumnAccessorKey="name"
    />
  );
};
