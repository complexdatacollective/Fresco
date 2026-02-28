'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { use, useMemo } from 'react';
import { DataTable } from '~/components/DataTable/DataTable';
import { DataTableToolbar } from '~/components/DataTable/DataTableToolbar';
import { useServerDataTable } from '~/hooks/useServerDataTable';
import type { Events } from '~/lib/db/generated/client';
import type { ActivitiesFeed } from '~/queries/activityFeed';
import {
  fetchActivityFeedTableColumnDefs,
  filterableColumns,
  searchableColumns,
} from './ColumnDefinition';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';

export default function ActivityFeedTable({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  const tableData = use(activitiesPromise);

  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  const { searchParams, setSearchParams } = useTableStateFromSearchParams();

  const { table } = useServerDataTable({
    data: tableData.events,
    columns,
    pageCount: tableData.pageCount,
    searchParams,
    setSearchParams,
  });

  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          searchableColumns={searchableColumns}
          filterableColumns={filterableColumns}
        />
      }
    />
  );
}
