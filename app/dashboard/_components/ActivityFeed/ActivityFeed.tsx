import { hash } from 'ohash';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { type getActivities } from '~/queries/activityFeed';
import ActivityFeedTable from './ActivityFeedTable';
import { searchParamsCache } from './SearchParams';

type ActivityFeedProps = {
  activitiesPromise: ReturnType<typeof getActivities>;
};

export default function ActivityFeed({ activitiesPromise }: ActivityFeedProps) {
  const searchParams = searchParamsCache.all();

  return (
    <Suspense
      key={hash(searchParams)}
      fallback={<DataTableSkeleton columnCount={3} filterableColumnCount={1} />}
    >
      <ActivityFeedTable activitiesPromise={activitiesPromise} />
    </Suspense>
  );
}
