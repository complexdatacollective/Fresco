import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type ColumnDef } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/Button';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import { DataTable } from './DataTable';
import { DataTableFloatingBar } from './DataTableFloatingBar';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableToolbar } from './DataTableToolbar';

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
};

const ROLES = ['Admin', 'User', 'Editor', 'Viewer'];
const STATUSES: Person['status'][] = ['active', 'inactive', 'pending'];

faker.seed(42);

const sampleData: Person[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  role: faker.helpers.arrayElement(ROLES),
  status: faker.helpers.arrayElement(STATUSES),
}));

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

const meta = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultTable({ data }: { data: Person[] }) {
  const { table } = useClientDataTable({ data, columns });
  return <DataTable table={table} />;
}

export const Default: Story = {
  render: () => <DefaultTable data={sampleData} />,
  args: {} as never,
};

function PaginatedTable() {
  const { table } = useClientDataTable({
    data: sampleData,
    columns,
  });
  return <DataTable table={table} />;
}

export const WithPagination: Story = {
  render: () => <PaginatedTable />,
  args: {} as never,
};

function NoPaginationTable() {
  const { table } = useClientDataTable({
    data: sampleData,
    columns,
    enablePagination: false,
  });
  return <DataTable table={table} showPagination={false} />;
}

export const WithoutPagination: Story = {
  render: () => <NoPaginationTable />,
  args: {} as never,
};

function SearchToolbarTable() {
  const { table } = useClientDataTable({ data: sampleData, columns });
  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          searchableColumns={[
            { id: 'name', title: 'by name' },
            { id: 'email', title: 'by email' },
          ]}
        />
      }
    />
  );
}

export const WithSearchToolbar: Story = {
  render: () => <SearchToolbarTable />,
  args: {} as never,
};

function FacetedFilterTable() {
  const { table } = useClientDataTable({ data: sampleData, columns });
  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          filterableColumns={[
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
          ]}
        />
      }
    />
  );
}

export const WithFacetedFilters: Story = {
  render: () => <FacetedFilterTable />,
  args: {} as never,
};

function FloatingBarTable() {
  const { table } = useClientDataTable({ data: sampleData, columns });
  return (
    <DataTable
      table={table}
      floatingBar={
        <DataTableFloatingBar table={table}>
          <Button
            color="destructive"
            size="sm"
            icon={<Trash className="size-4" />}
          >
            Delete Selected
          </Button>
        </DataTableFloatingBar>
      }
    />
  );
}

export const WithFloatingBar: Story = {
  render: () => <FloatingBarTable />,
  args: {} as never,
};

function HeaderItemsTable() {
  const { table } = useClientDataTable({ data: sampleData, columns });
  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          searchableColumns={[{ id: 'name', title: 'by name' }]}
        >
          <Button color="primary" size="sm">
            Add Person
          </Button>
          <Button size="sm">Export</Button>
        </DataTableToolbar>
      }
    />
  );
}

export const WithHeaderItems: Story = {
  render: () => <HeaderItemsTable />,
  args: {} as never,
};

function FullyFeaturedTable() {
  const { table } = useClientDataTable({ data: sampleData, columns });
  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          searchableColumns={[
            { id: 'name', title: 'by name' },
            { id: 'email', title: 'by email' },
          ]}
          filterableColumns={[
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
          ]}
        >
          <Button color="primary" size="sm">
            Add Person
          </Button>
        </DataTableToolbar>
      }
      floatingBar={
        <DataTableFloatingBar table={table}>
          <Button
            color="destructive"
            size="sm"
            icon={<Trash className="size-4" />}
          >
            Delete Selected
          </Button>
        </DataTableFloatingBar>
      }
    />
  );
}

export const FullyFeatured: Story = {
  render: () => <FullyFeaturedTable />,
  args: {} as never,
};

export const Empty: Story = {
  render: () => <DefaultTable data={[]} />,
  args: {} as never,
};

export const Skeleton: Story = {
  render: () => (
    <DataTableSkeleton
      columnCount={4}
      rowCount={5}
      searchableColumnCount={1}
      headerItemsCount={1}
    />
  ),
  args: {} as never,
};
