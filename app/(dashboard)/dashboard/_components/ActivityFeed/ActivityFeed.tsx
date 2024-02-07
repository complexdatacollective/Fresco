'use server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { searchParamsSchema, type SearchParams } from '~/lib/data-table/types';
import ActivityFeedTable from './ActivityFeedTable';
import { api } from '~/trpc/server';
import { unstable_noStore } from 'next/cache';

export type IndexPageProps = {
  searchParams: SearchParams;
};

export const ActivityFeed = ({ searchParams }: IndexPageProps) => {
  unstable_noStore();
  const { sort, message } = searchParamsSchema.parse(searchParams);
  const activitiesPromise = api.dashboard.getActivities.query(searchParams);

  return (
    <>
      <Suspense
        key={`${sort}-${message}`}
        fallback={
          <DataTableSkeleton columnCount={3} filterableColumnCount={1} />
        }
      >
        <ActivityFeedTable activitiesPromise={activitiesPromise} />
      </Suspense>
    </>
  );
};
