import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import { api } from '~/trpc/server';

const ProtocolsPage = async () => {
  let protocols;
  try {
    protocols = await api.protocol.get.all.query();
  } catch (error) {
    throw new Error(error as string);
  }

  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Protocols management view</h2>
      <ProtocolsTable initialData={protocols} />
    </div>
  );
};

export default ProtocolsPage;
