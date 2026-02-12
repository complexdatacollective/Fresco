import { Suspense } from 'react';
import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';

export default function ParticipantPage() {
  return (
    <>
      <PageHeader
        headerText="Participants"
        subHeaderText="View and manage your participants."
        data-testid="participants-page-header"
      />
      <Suspense fallback={<DataTableSkeleton columnCount={5} />}>
        <AuthenticatedParticipants />
      </Suspense>
    </>
  );
}

async function AuthenticatedParticipants() {
  await Promise.all([requireAppNotExpired(), requirePageAuth()]);
  return (
    <>
      <ImportExportSection />
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <ParticipantsTable />
      </ResponsiveContainer>
    </>
  );
}
