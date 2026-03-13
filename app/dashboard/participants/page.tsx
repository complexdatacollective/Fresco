import { Suspense } from 'react';
import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import { DataTableSkeleton } from '~/components/DataTable/DataTableSkeleton';
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
              headerItemsCount={3}
            />
          </ResponsiveContainer>
        }
      >
        <AuthenticatedParticipants />
      </Suspense>
    </>
  );
}

async function AuthenticatedParticipants() {
  await requireAppNotExpired();
  await requirePageAuth();
  return (
    <>
      <ImportExportSection />
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <ParticipantsTable />
      </ResponsiveContainer>
    </>
  );
}
