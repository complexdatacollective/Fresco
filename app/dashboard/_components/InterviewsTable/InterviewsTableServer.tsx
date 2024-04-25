import { InterviewsTable } from './InterviewsTable';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getInterviews } from '~/queries/interviews';

export default function InterviewsTableServer() {
  const interviewsPromise = getInterviews();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={5} filterableColumnCount={3} />}
    >
      <InterviewsTable interviewsPromise={interviewsPromise} />
    </Suspense>
  );
}
