import { Suspense } from 'react';

import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import { getInterviewFilterOptions, getInterviews } from '~/queries/interviews';
import { getProtocols } from '~/queries/protocols';

import { InterviewsTable } from './InterviewsTable';
import type { InterviewsSearchParams } from './searchParams';

export default function InterviewsTableServer({
  searchParams,
}: {
  searchParams: InterviewsSearchParams;
}) {
  const interviewsPromise = getInterviews(searchParams);
  const filterOptionsPromise = getInterviewFilterOptions();
  const protocolsPromise = getProtocols();

  return (
    <Suspense
      fallback={
        <DataTableSkeleton
          columnCount={7}
          searchableColumnCount={1}
          headerItemsCount={2}
        />
      }
    >
      <InterviewsTable
        interviewsPromise={interviewsPromise}
        filterOptionsPromise={filterOptionsPromise}
        protocolsPromise={protocolsPromise}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
