import { InterviewsTable } from './InterviewsTable';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getInterviews } from '~/queries/interviews';
import { getProtocols } from '~/queries/protocols';

export default function InterviewsTableServer() {
  const interviewsPromise = getInterviews();
  const protocolsPromise = getProtocols();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={5} filterableColumnCount={3} />}
    >
      <InterviewsTable
        interviewsPromise={interviewsPromise}
        protocolsPromise={protocolsPromise}
      />
    </Suspense>
  );
}
