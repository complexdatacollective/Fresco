'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDataTable } from '~/hooks/use-data-table';
import { DataTable } from '~/components/data-table/data-table';
import {
  fetchActivityFeedTableColumnDefs,
  searchableColumns,
  filterableColumns,
} from './ColumnDefinition';
import type { Events } from '@prisma/client';
import { type RouterOutputs } from '~/trpc/shared';

type ActivityFeedTableProps = {
  data: RouterOutputs['dashboard']['getActivities']['tableData'];
  pageCount: RouterOutputs['dashboard']['getActivities']['pageCount'];
};

export default function ActivityFeedTable({
  data,
  pageCount,
}: ActivityFeedTableProps) {
  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  const { dataTable } = useDataTable({
    data,
    columns,
    pageCount,
    searchableColumns,
    filterableColumns,
  });

  return (
    <DataTable
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      // floatingBarContent={TasksTableFloatingBarContent(dataTable)}
      // deleteRowsAction={(_event) => {}}
    />
  );
}
