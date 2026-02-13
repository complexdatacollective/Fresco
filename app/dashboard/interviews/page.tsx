import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
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
        <Suspense fallback={<DataTableSkeleton columnCount={6} />}>
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
