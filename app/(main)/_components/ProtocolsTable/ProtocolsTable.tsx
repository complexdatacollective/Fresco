import { prisma } from '~/utils/db';
import { DataTable } from '~/components/DataTable/DataTable';
import { ProtocolColumns } from '~/app/(main)/_components/ProtocolsTable/Columns';

const getProtocols = async () => {
  const protocols = await prisma.protocol.findMany();
  return protocols;
};
const protocols = await getProtocols();

export const ProtocolsTable = () => {
  return <DataTable columns={ProtocolColumns} data={protocols} />;
};
