import { flexRender, type ColumnDef } from '@tanstack/react-table';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ActiveFilterChips } from '~/components/DataTable/filters/ActiveFilterChips';
import { FilterableColumnHeader } from '~/components/DataTable/filters/FilterableColumnHeader';
import {
  booleanFilterFn,
  dateFilterFn,
  facetedFilterFn,
  rangeFilterFn,
} from '~/components/DataTable/filters/filterFns';
import { Button } from '~/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useClientDataTable } from '~/hooks/useClientDataTable';

type FilterablePerson = {
  name: string;
  role: string;
  score: number;
  active: boolean;
  joinDate: Date;
};

const roles = ['Engineer', 'Designer', 'Manager', 'QA', 'DevOps'] as const;

const sampleData: FilterablePerson[] = [
  {
    name: 'Alice Johnson',
    role: 'Engineer',
    score: 92,
    active: true,
    joinDate: new Date('2023-01-15'),
  },
  {
    name: 'Bob Smith',
    role: 'Designer',
    score: 78,
    active: true,
    joinDate: new Date('2023-03-22'),
  },
  {
    name: 'Carol Davis',
    role: 'Manager',
    score: 45,
    active: false,
    joinDate: new Date('2022-11-10'),
  },
  {
    name: 'Dan Wilson',
    role: 'QA',
    score: 88,
    active: true,
    joinDate: new Date('2024-02-01'),
  },
  {
    name: 'Eve Martinez',
    role: 'DevOps',
    score: 63,
    active: false,
    joinDate: new Date('2023-07-18'),
  },
  {
    name: 'Frank Lee',
    role: 'Engineer',
    score: 95,
    active: true,
    joinDate: new Date('2022-06-05'),
  },
  {
    name: 'Grace Chen',
    role: 'Designer',
    score: 30,
    active: false,
    joinDate: new Date('2024-05-12'),
  },
  {
    name: 'Henry Kim',
    role: 'Manager',
    score: 71,
    active: true,
    joinDate: new Date('2023-09-30'),
  },
  {
    name: 'Ivy Patel',
    role: 'QA',
    score: 54,
    active: true,
    joinDate: new Date('2024-01-08'),
  },
  {
    name: 'Jack Brown',
    role: 'Engineer',
    score: 82,
    active: false,
    joinDate: new Date('2022-12-20'),
  },
  {
    name: 'Karen White',
    role: 'DevOps',
    score: 19,
    active: true,
    joinDate: new Date('2023-04-14'),
  },
  {
    name: 'Leo Nguyen',
    role: 'Designer',
    score: 67,
    active: true,
    joinDate: new Date('2024-03-25'),
  },
];

const columns: ColumnDef<FilterablePerson>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Name" />
    ),
  },
  {
    id: 'role',
    accessorKey: 'role',
    meta: {
      filterType: 'faceted' as const,
      filterConfig: {
        type: 'faceted' as const,
        options: roles.map((r) => ({ label: r, value: r })),
      },
    },
    filterFn: facetedFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Role" />
    ),
  },
  {
    id: 'score',
    accessorKey: 'score',
    meta: {
      filterType: 'range' as const,
      filterConfig: {
        type: 'range' as const,
        min: 0,
        max: 100,
        step: 1,
        presets: [
          { label: 'Low', min: 0, max: 33 },
          { label: 'Medium', min: 34, max: 66 },
          { label: 'High', min: 67, max: 100 },
        ],
      },
    },
    filterFn: rangeFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Score" />
    ),
  },
  {
    id: 'active',
    accessorKey: 'active',
    meta: {
      filterType: 'boolean' as const,
      filterConfig: {
        type: 'boolean' as const,
        trueLabel: 'Active',
        falseLabel: 'Inactive',
      },
    },
    filterFn: booleanFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Active" />
    ),
    cell: ({ row }) => (row.original.active ? 'Yes' : 'No'),
  },
  {
    id: 'joinDate',
    accessorKey: 'joinDate',
    meta: {
      filterType: 'date' as const,
      filterConfig: { type: 'date' as const },
    },
    filterFn: dateFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Join Date" />
    ),
    cell: ({ row }) => row.original.joinDate.toLocaleDateString(),
  },
];

function FilterableDataTable() {
  const { table } = useClientDataTable({
    data: sampleData,
    columns,
    enableRowSelection: false,
  });

  return (
    <div className="space-y-4">
      <ActiveFilterChips table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} of {sampleData.length}{' '}
          row(s) shown.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'DataTable/WithColumnFilters',
  component: FilterableDataTable,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FilterableDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithColumnFilters: Story = {
  args: {} as never,
  render: () => <FilterableDataTable />,
};
