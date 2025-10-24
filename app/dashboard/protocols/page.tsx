import { Suspense } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ProtocolsTable from '../_components/ProtocolsTable/ProtocolsTable';
import UpdateUploadThingTokenAlert from '../_components/UpdateUploadThingTokenAlert';

export default async function ProtocolsPage() {
  await requireAppNotExpired();
  await requirePageAuth();

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
        <Suspense fallback={null}>
          <UpdateUploadThingTokenAlert />
        </Suspense>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <ProtocolsTable />
      </ResponsiveContainer>
    </>
  );
}
