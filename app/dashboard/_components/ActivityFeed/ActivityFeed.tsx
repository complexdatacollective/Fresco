'use client';

import type { Events } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';

export const ActivityFeed = () => {
  const params = useSearchParams();

  const { isPending, data } = useQuery({
    queryKey: ['activityFeed', params.toString()],
    queryFn: async () => {
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
