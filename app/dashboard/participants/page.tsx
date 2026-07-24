import { type SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import { searchParamsCache } from '~/app/dashboard/_components/ParticipantsTable/searchParams';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import ResponsiveContainer from '@codaco/fresco-ui/layout/ResponsiveContainer';
import PageHeader from '@codaco/fresco-ui/typography/PageHeader';
import { requirePageAuth } from '~/lib/auth/guards';
import { requireAppNotExpired } from '~/queries/appSettings';

export default function ParticipantPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
        <AuthenticatedParticipants searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AuthenticatedParticipants({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAppNotExpired();
  await requirePageAuth();
  const parsed = await searchParamsCache.parse(searchParams);
  return (
    <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
      <ParticipantsTable searchParams={parsed} />
    </ResponsiveContainer>
  );
}
