'use client';

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterParam } from '~/components/DataTable/types';

type SearchParamsState = {
  page: number;
  perPage: number;
  sort: string;
  sortField: string;
  filterParams: FilterParam[] | null;
};

type UseServerDataTableOptions<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  pageCount: number;
  searchParams: SearchParamsState;
  setSearchParams: (params: Record<string, unknown>) => void | Promise<unknown>;
};

export function useServerDataTable<TData, TValue>({
  data,
  columns,
  pageCount,
  searchParams,
  setSearchParams,
}: UseServerDataTableOptions<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    (searchParams.filterParams as ColumnFiltersState) ?? [],
  );

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: searchParams.page - 1,
    pageSize: searchParams.perPage,
  });

  const pagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateFilterParams = useCallback(
    debounce(
      (filters: FilterParam[]) => {
        void setSearchParams({
          page: 1,
          filterParams: filters,
        });
      },
      2000,
      { edges: ['trailing'] },
    ),
    [],
  );

  useEffect(() => {
    if (!columnFilters || columnFilters.length === 0) {
      void setSearchParams({ filterParams: null });
      return;
    }
    debouncedUpdateFilterParams(columnFilters as FilterParam[]);
  }, [columnFilters, setSearchParams, debouncedUpdateFilterParams]);

  useEffect(() => {
    setPagination({
      pageIndex: searchParams.page - 1,
      pageSize: searchParams.perPage,
    });
  }, [searchParams.page, searchParams.perPage]);

  useEffect(() => {
    void setSearchParams({
      page: pageIndex + 1,
      perPage: pageSize,
    });
  }, [pageIndex, pageSize, setSearchParams]);

  const [sorting, setSorting] = useState<SortingState>(
    searchParams.sort === 'none'
      ? []
      : [
          {
            id: searchParams.sortField,
            desc: searchParams.sort === 'desc',
          },
        ],
  );

  useEffect(() => {
    if (sorting.length === 0) {
      void setSearchParams({
        sort: null,
        sortField: null,
      });
      return;
    }
    void setSearchParams({
      sort: sorting[0]?.desc ? 'desc' : 'asc',
      sortField: sorting[0]?.id,
    });
  }, [sorting, setSearchParams]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination,
      sorting,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table };
}
