import { Suspense } from 'react';
import ProtocolUploader from '../_components/ProtocolUploader';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';

const ProtocolsPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Protocols management view</h2>
      <ProtocolUploader />
      <Suspense fallback={<div>Loading table...</div>}>
        <ProtocolsTable />
      </Suspense>
    </div>
  );
};

export default ProtocolsPage;
