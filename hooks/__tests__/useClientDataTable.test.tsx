import { renderHook, act } from '@testing-library/react';
import { type ColumnDef } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';
import { useClientDataTable } from '~/hooks/useClientDataTable';

vi.mock('nuqs', () => ({
  useQueryState: () => [[], vi.fn()],
  parseAsJson: () => ({ withDefault: () => ({}) }),
}));

type TestRow = { id: string; name: string };

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'name' },
];

const data: TestRow[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

describe('useClientDataTable', () => {
  it('initializes with empty column filters by default', () => {
    const { result } = renderHook(() => useClientDataTable({ data, columns }));
    expect(result.current.table.getState().columnFilters).toEqual([]);
  });

  it('applies column filter to reduce visible rows', () => {
    const { result } = renderHook(() => useClientDataTable({ data, columns }));
    act(() => {
      result.current.table.getColumn('name')?.setFilterValue('Alice');
    });
    expect(result.current.table.getFilteredRowModel().rows).toHaveLength(1);
  });
});
