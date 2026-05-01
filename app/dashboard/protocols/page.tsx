import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/DataTable/DataTableSkeleton';
import ResponsiveContainer from '@codaco/fresco-ui/layout/ResponsiveContainer';
import PageHeader from '@codaco/fresco-ui/typography/PageHeader';
import { requirePageAuth } from '~/lib/auth/guards';
import { requireAppNotExpired } from '~/queries/appSettings';
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
