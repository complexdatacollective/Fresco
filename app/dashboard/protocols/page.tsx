import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/DataTable/DataTableSkeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ProtocolsTable from '../_components/ProtocolsTable/ProtocolsTable';
import UpdateUploadThingTokenAlert from '../_components/UpdateUploadThingTokenAlert';

export default function ProtocolsPage() {
  return (
    <>
      <PageHeader
        headerText="Protocols"
        subHeaderText="Upload and manage your interview protocols."
        data-testid="protocols-page-header"
      />
      <Suspense
        fallback={
          <ResponsiveContainer
            maxWidth="6xl"
            baseSize="content"
            container={false}
          >
            <DataTableSkeleton
              columnCount={4}
              searchableColumnCount={1}
              headerItemsCount={1}
            />
          </ResponsiveContainer>
        }
      >
        <AuthenticatedProtocols />
      </Suspense>
    </>
  );
}

async function AuthenticatedProtocols() {
  await requireAppNotExpired();
  await requirePageAuth();
  return (
    <>
      <Suspense fallback={null}>
        <UpdateUploadThingTokenAlert />
      </Suspense>
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <ProtocolsTable />
      </ResponsiveContainer>
    </>
  );
}
