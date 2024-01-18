import { Suspense } from 'react';
import ProtocolUploader from '../_components/ProtocolUploader';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import NoSSRWrapper from '~/utils/NoSSRWrapper';

const ProtocolsPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Protocols management view</h2>
      <ProtocolUploader />
      <NoSSRWrapper>
        <Suspense fallback={<div>Loading table...</div>}>
          <ProtocolsTable />
        </Suspense>
      </NoSSRWrapper>
    </div>
  );
};

export default ProtocolsPage;
