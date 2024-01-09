import ResponsiveContainer from '~/components/ResponsiveContainer';
import ProtocolUploader from '../_components/ProtocolUploader';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic';

const ProtocolsPage = async () => {
  const protocols = await api.protocol.get.all.query();
  return (
    <ResponsiveContainer>
      <h2 className="mb-6 text-2xl font-bold">Protocols management view</h2>
      <ProtocolUploader />
      <ProtocolsTable initialData={protocols} />
    </ResponsiveContainer>
  );
};

export default ProtocolsPage;
