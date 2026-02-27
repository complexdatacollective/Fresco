import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '~/components/ui/badge';
import { DataTable } from './DataTable';

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
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
  {
    id: '11',
    name: 'Karen Thomas',
    email: 'karen@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '12',
    name: 'Leo Garcia',
    email: 'leo@example.com',
    role: 'Editor',
    status: 'inactive',
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

export const Default: Story = {
  render: () => <DataTable columns={columns} data={sampleData} />,
  args: {} as never,
};

export const WithoutPagination: Story = {
  render: () => (
    <DataTable columns={columns} data={sampleData} showPagination={false} />
  ),
  args: {} as never,
};

export const WithFilter: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={sampleData}
      filterColumnAccessorKey="name"
    />
  ),
  args: {} as never,
};

export const Empty: Story = {
  render: () => (
    <DataTable columns={columns} data={[]} emptyText="No users found." />
  ),
  args: {} as never,
};
