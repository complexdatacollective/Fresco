import { ProtocolsTable } from '~/app/(dashboard)/dashboard/_components/ProtocolsTable/ProtocolsTable';
import { trpc } from '~/app/_trpc/server';

const ProtocolsPage = async () => {
  const protocols = await trpc.protocol.get.all.query(undefined, {
    context: {
      revalidate: 0,
    },
  });
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Protocols management view</h2>
      <ProtocolsTable initialData={protocols} />
    </div>
  );
};

export default ProtocolsPage;
