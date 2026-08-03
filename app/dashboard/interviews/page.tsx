import { type SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import ResponsiveContainer from '@codaco/fresco-ui/layout/ResponsiveContainer';
import PageHeader from '@codaco/fresco-ui/typography/PageHeader';
import { requirePageAuth } from '~/lib/auth/guards';
import { requireAppNotExpired } from '~/queries/appSettings';
import { searchParamsCache } from '../_components/InterviewsTable/searchParams';
import InterviewsTableServer from '../_components/InterviewsTable/InterviewsTableServer';

export default function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <PageHeader
        headerText="Interviews"
        subHeaderText="View and manage your interview data."
        data-testid="interviews-page-header"
      />
      <ResponsiveContainer maxWidth="full" baseSize="content" container={false}>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={7}
              searchableColumnCount={1}
              headerItemsCount={2}
            />
          }
        >
          <AuthenticatedInterviews searchParams={searchParams} />
        </Suspense>
      </ResponsiveContainer>
    </>
  );
}

async function AuthenticatedInterviews({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAppNotExpired();
  await requirePageAuth();
  const parsed = await searchParamsCache.parse(searchParams);
  return <InterviewsTableServer searchParams={parsed} />;
}
