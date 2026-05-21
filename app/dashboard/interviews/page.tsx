import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import ResponsiveContainer from '@codaco/fresco-ui/layout/ResponsiveContainer';
import PageHeader from '@codaco/fresco-ui/typography/PageHeader';
import { requirePageAuth } from '~/lib/auth/guards';
import { requireAppNotExpired } from '~/queries/appSettings';
import InterviewsTableServer from '../_components/InterviewsTable/InterviewsTableServer';

export default function InterviewPage() {
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
          <AuthenticatedInterviews />
        </Suspense>
      </ResponsiveContainer>
    </>
  );
}

async function AuthenticatedInterviews() {
  await requireAppNotExpired();
  await requirePageAuth();
  return <InterviewsTableServer />;
}
