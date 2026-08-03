import { act, renderHook } from '@testing-library/react';
import { type ColumnDef } from '@tanstack/react-table';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useClientDataTable } from '~/hooks/useClientDataTable';

type TestRow = { id: string; status: string };

const columns: ColumnDef<TestRow, string>[] = [
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

    expect(result.current.table.getState().columnFilters).toEqual([]);
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
});
