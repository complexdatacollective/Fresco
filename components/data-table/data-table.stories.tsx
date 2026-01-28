import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '~/components/ui/badge';
import { DataTable } from './data-table';

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
};

type StoryOption = {
  label: string;
  value: string;
};

type StoryFilterableColumn = {
  id: keyof Person;
  title: string;
  options: StoryOption[];
};

const sampleData: Person[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Editor',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Viewer',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Eve Davis',
    email: 'eve@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '6',
    name: 'Frank Wilson',
    email: 'frank@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '7',
    name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'Editor',
    status: 'inactive',
  },
  {
    id: '8',
    name: 'Henry Taylor',
    email: 'henry@example.com',
    role: 'User',
    status: 'pending',
  },
  {
    id: '9',
    name: 'Iris Martinez',
    email: 'iris@example.com',
    role: 'Viewer',
    status: 'active',
  },
  {
    id: '10',
    name: 'Jack Anderson',
    email: 'jack@example.com',
    role: 'Admin',
    status: 'active',
  },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => <div>{row.getValue('role')}</div>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = String(row.getValue('status'));
      return (
        <Badge
          variant={
            status === 'active'
              ? 'default'
              : status === 'inactive'
                ? 'secondary'
                : 'outline'
          }
        >
          {status}
        </Badge>
      );
    },
  },
];

function DataTableWrapper({ data }: { data: Person[] }) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const dataTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return <DataTable dataTable={dataTable} columns={columns} />;
}

export const Default: Story = {
  render: () => <DataTableWrapper data={sampleData} />,
  args: {} as never,
};

export const WithSearchableColumns: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 5,
    });

    const dataTable = useReactTable({
      data: sampleData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
        pagination,
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
      <DataTable
        dataTable={dataTable}
        columns={columns}
        searchableColumns={[
          { id: 'name', title: 'by name' },
          { id: 'email', title: 'by email' },
        ]}
      />
    );
  },
  args: {} as never,
};

export const WithFilterableColumns: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 5,
    });

    const dataTable = useReactTable({
      data: sampleData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
        pagination,
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const filterableColumns: StoryFilterableColumn[] = [
      {
        id: 'role',
        title: 'Role',
        options: [
          { label: 'Admin', value: 'Admin' },
          { label: 'User', value: 'User' },
          { label: 'Editor', value: 'Editor' },
          { label: 'Viewer', value: 'Viewer' },
        ],
      },
      {
        id: 'status',
        title: 'Status',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ];

    return (
      <DataTable
        dataTable={dataTable}
        columns={columns}
        filterableColumns={filterableColumns as never}
      />
    );
  },
  args: {} as never,
};

export const WithAdvancedFilter: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 5,
    });

    const dataTable = useReactTable({
      data: sampleData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
        pagination,
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const filterableColumns: StoryFilterableColumn[] = [
      {
        id: 'role',
        title: 'Role',
        options: [
          { label: 'Admin', value: 'Admin' },
          { label: 'User', value: 'User' },
          { label: 'Editor', value: 'Editor' },
          { label: 'Viewer', value: 'Viewer' },
        ],
      },
      {
        id: 'status',
        title: 'Status',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ];

    return (
      <DataTable
        dataTable={dataTable}
        columns={columns}
        advancedFilter={true}
        filterableColumns={filterableColumns as never}
        searchableColumns={[
          { id: 'name', title: 'by name' },
          { id: 'email', title: 'by email' },
        ]}
      />
    );
  },
  args: {} as never,
};

export const WithFloatingBar: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 5,
    });

    const dataTable = useReactTable({
      data: sampleData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
        pagination,
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
      <DataTable
        dataTable={dataTable}
        columns={columns}
        floatingBarContent={
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {Object.keys(rowSelection).length} row(s) selected
            </span>
          </div>
        }
      />
    );
  },
  args: {} as never,
};

export const EmptyState: Story = {
  render: () => <DataTableWrapper data={[]} />,
  args: {} as never,
};

export const FullyFeatured: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 5,
    });

    const dataTable = useReactTable({
      data: sampleData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
        pagination,
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const filterableColumns: StoryFilterableColumn[] = [
      {
        id: 'role',
        title: 'Role',
        options: [
          { label: 'Admin', value: 'Admin' },
          { label: 'User', value: 'User' },
          { label: 'Editor', value: 'Editor' },
          { label: 'Viewer', value: 'Viewer' },
        ],
      },
      {
        id: 'status',
        title: 'Status',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ];

    return (
      <DataTable
        dataTable={dataTable}
        columns={columns}
        searchableColumns={[
          { id: 'name', title: 'by name' },
          { id: 'email', title: 'by email' },
        ]}
        filterableColumns={filterableColumns as never}
        deleteRowsAction={() => {
          alert('Delete action triggered');
        }}
        floatingBarContent={
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {Object.keys(rowSelection).length} row(s) selected
            </span>
          </div>
        }
      />
    );
  },
  args: {} as never,
};
