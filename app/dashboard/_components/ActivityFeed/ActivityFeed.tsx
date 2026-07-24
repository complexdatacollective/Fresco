import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import { type fetchActivities } from '~/queries/activityFeed';
import ActivityFeedTable from './ActivityFeedTable';

type ActivityFeedProps = {
  activitiesPromise: ReturnType<typeof fetchActivities>;
};

export default function ActivityFeed({ activitiesPromise }: ActivityFeedProps) {
  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={3} filterableColumnCount={1} />}
    >
      <ActivityFeedTable activitiesPromise={activitiesPromise} />
    </Suspense>
  );
}
