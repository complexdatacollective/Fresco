'use client';

import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { api } from '~/trpc/client';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';
import { type RouterOutputs } from '~/trpc/shared';

export const ActivityFeed = ({
  initialData,
}: {
  initialData: RouterOutputs['dashboard']['getActivities'];
}) => {
  const { searchParams } = useTableStateFromSearchParams();
  const { data, isLoading } = api.dashboard.getActivities.useQuery(
    searchParams,
    {
      initialData,
      refetchOnMount: false,
      onError(error) {
        throw new Error(error.message);
      },
    },
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} filterableColumnCount={1} />;
  }

  return <ActivityFeedTable tableData={data ?? { events: [], pageCount: 0 }} />;
};
