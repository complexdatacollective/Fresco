import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getInterviews } from '~/queries/interviews';
import { getProtocols } from '~/queries/protocols';
import { InterviewsTable } from './InterviewsTable';

export default function InterviewsTableServer() {
  const interviewsPromise = getInterviews();
  const protocolsPromise = getProtocols();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={7} filterableColumnCount={7} />}
    >
      <InterviewsTable
        interviewsPromise={interviewsPromise}
        protocolsPromise={protocolsPromise}
      />
    </Suspense>
  );
}
