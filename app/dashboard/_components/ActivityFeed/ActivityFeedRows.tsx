'use client';

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { use, useMemo } from 'react';
import { DataTable } from '~/components/DataTable/DataTable';
import { useNuqsTable } from '~/components/DataTable/nuqs/NuqsTableProvider';
import type { Events } from '~/lib/db/generated/client';
import type { ActivitiesFeed } from '~/queries/activityFeed';
import { fetchActivityFeedTableColumnDefs } from './ColumnDefinition';
import { searchParamsUrlKeys } from './SearchParams';
import { activityTypes, sortableFields, sortOrder } from './types';

export default function ActivityFeedRows({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const tableData = use(activitiesPromise);
  const { startTransition } = useNuqsTable();

  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  // Pagination + sort writes go through the shared transition so the table
  // fades during the refetch. Filter keys (q, type) are read-only here —
  // they're owned by the toolbar components, and we mirror them into the
  // react-table `columnFilters` state below so the column highlight styling
  // reflects the active filter.
  const [{ page, perPage, sort, sortField, q, type }, setTableState] =
    useQueryStates(
      {
        page: parseAsInteger.withDefault(1),
        perPage: parseAsInteger.withDefault(10),
        sort: parseAsStringLiteral(sortOrder).withDefault('none'),
        sortField:
          parseAsStringLiteral(sortableFields).withDefault('timestamp'),
        q: parseAsString,
        type: parseAsArrayOf(parseAsStringLiteral(activityTypes)),
      },
      {
        urlKeys: searchParamsUrlKeys,
        shallow: false,
        clearOnDefault: true,
        startTransition,
      },
    );

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: perPage,
  };

  const sorting: SortingState =
    sort === 'none' ? [] : [{ id: sortField, desc: sort === 'desc' }];

  // Derived for column highlighting only. The server does the actual
  // filtering via `manualFiltering: true`, and the toolbar owns writes to
  // these URL params — this local state is feed-only.
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (q) filters.push({ id: 'message', value: q });
    if (type && type.length > 0) filters.push({ id: 'type', value: type });
    return filters;
  }, [q, type]);

  const table = useReactTable({
    data: tableData.events,
    columns,
    pageCount: tableData.pageCount,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      void setTableState({
        page: next.pageIndex + 1,
        perPage: next.pageSize,
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (!first) {
        void setTableState({ sort: null, sortField: null });
        return;
      }
      if (
        first.id === 'timestamp' ||
        first.id === 'type' ||
        first.id === 'message'
      ) {
        void setTableState({
          sort: first.desc ? 'desc' : 'asc',
          sortField: first.id,
        });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return <DataTable table={table} />;
}
