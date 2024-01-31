"use server";
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import type { SearchParams } from '~/lib/data-table/types';
import ActivityFeedTable from './ActivityFeedTable';
import { getActivities } from './utils';

export type IndexPageProps = {
  searchParams: SearchParams;
};

export const ActivityFeed = ({ searchParams }: IndexPageProps) => {
  const activitiesPromise = getActivities(searchParams);

  return (
    <>
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={3} filterableColumnCount={1} />
        }
      >
        <ActivityFeedTable activitiesPromise={activitiesPromise} />
      </Suspense>
    </>
  );
};
