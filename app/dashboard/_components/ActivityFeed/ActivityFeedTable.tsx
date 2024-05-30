'use client';

import { use, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDataTable } from '~/hooks/use-data-table';
import { DataTable } from '~/components/data-table/data-table';
import {
  fetchActivityFeedTableColumnDefs,
  searchableColumns,
  filterableColumns,
} from './ColumnDefinition';
import type { Events } from '@prisma/client';
import type { ActivitiesFeed } from '~/queries/activityFeed';

export default function ActivityFeedTable({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  const tableData = use(activitiesPromise);

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  const { dataTable } = useDataTable({
    data: tableData.events,
    columns,
    pageCount: tableData.pageCount,
    searchableColumns,
    filterableColumns,
  });

  return (
    <DataTable
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
    />
  );
}
