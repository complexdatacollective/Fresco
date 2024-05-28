'use client';

import type { Events } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { hash } from 'ohash';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';

export const ActivityFeed = () => {
  const { searchParams } = useTableStateFromSearchParams();

  const { isPending, data } = useQuery({
    queryKey: ['activityFeed', hash(searchParams)],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', searchParams.page.toString());
      params.set('perPage', searchParams.perPage.toString());
      params.set('sort', searchParams.sort);
      params.set('sortField', searchParams.sortField);
      params.set('filterParams', JSON.stringify(searchParams.filterParams));

      const response = await fetch(`/api/activity-feed?${params.toString()}`, {
        next: { tags: ['activityFeed'] },
      });
      return response.json() as Promise<{
        events: Events[];
        pageCount: number;
      }>;
    },
  });

  if (isPending || !data) {
    return <DataTableSkeleton columnCount={3} filterableColumnCount={1} />;
  }

  return <ActivityFeedTable tableData={data} />;
};
