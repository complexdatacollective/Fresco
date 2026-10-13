import { act, renderHook } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { type DataTableColumnDef } from '@codaco/fresco-ui/DataTable/types';
import { useClientDataTable } from '~/hooks/useClientDataTable';

type TestRow = { id: string; status: string };

const columns: DataTableColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'status', header: 'Status' },
];

const data: TestRow[] = [
  { id: '1', status: 'active' },
  { id: '2', status: 'inactive' },
  { id: '3', status: 'active' },
];

function wrapper({ children }: { children: ReactNode }) {
  return <NuqsTestingAdapter>{children}</NuqsTestingAdapter>;
}

describe('useClientDataTable', () => {
  it('initializes with empty column filters', () => {
    const { result } = renderHook(() => useClientDataTable({ data, columns }), {
      wrapper,
    });

    expect(result.current.table.state.columnFilters).toEqual([]);
  });

  it('applies column filter to reduce visible rows', () => {
    const { result } = renderHook(() => useClientDataTable({ data, columns }), {
      wrapper,
    });

    act(() => {
      result.current.table.getColumn('status')?.setFilterValue('inactive');
    });

    expect(result.current.table.getFilteredRowModel().rows).toHaveLength(1);
    expect(
      result.current.table.getFilteredRowModel().rows[0]?.getValue('status'),
    ).toBe('inactive');
  });

  it('sorts rows with a registered sortFn named by string', () => {
    const sortable: DataTableColumnDef<TestRow>[] = [
      { accessorKey: 'id', header: 'ID', sortFn: 'text' },
      { accessorKey: 'status', header: 'Status', sortFn: 'text' },
    ];
    const { result } = renderHook(
      () =>
        useClientDataTable({
          data,
          columns: sortable,
          defaultSortBy: { id: 'id', desc: true },
        }),
      { wrapper },
    );

    const ids = () =>
      result.current.table.getRowModel().rows.map((row) => row.original.id);
    expect(ids()).toEqual(['3', '2', '1']);

    act(() => {
      result.current.table.getColumn('id')?.toggleSorting(false);
    });
    expect(ids()).toEqual(['1', '2', '3']);
  });

  it('paginates client-side by default and shows every row without pagination', () => {
    const many: TestRow[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      status: 'active',
    }));

    const paged = renderHook(
      () => useClientDataTable({ data: many, columns }),
      { wrapper },
    );
    expect(paged.result.current.table.getRowModel().rows).toHaveLength(10);
    expect(paged.result.current.table.getPageCount()).toBe(2);

    act(() => {
      paged.result.current.table.nextPage();
    });
    expect(paged.result.current.table.getRowModel().rows).toHaveLength(2);

    const unpaged = renderHook(
      () =>
        useClientDataTable({ data: many, columns, enablePagination: false }),
      { wrapper },
    );
    expect(unpaged.result.current.table.getRowModel().rows).toHaveLength(12);
  });

  it('tracks row selection, including the filtered selection', () => {
    const { result } = renderHook(() => useClientDataTable({ data, columns }), {
      wrapper,
    });

    act(() => {
      result.current.table.getRowModel().rows[1]?.toggleSelected(true);
    });

    expect(result.current.table.state.rowSelection).toEqual({ '1': true });
    expect(
      result.current.table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id),
    ).toEqual(['2']);
    expect(result.current.table.getIsSomePageRowsSelected()).toBe(true);
    expect(result.current.table.getIsAllPageRowsSelected()).toBe(false);
  });
});
