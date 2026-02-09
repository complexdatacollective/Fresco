import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Editor' },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Viewer',
  },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'User' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((person) => (
          <TableRow key={person.id}>
            <TableCell>{person.name}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>{person.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithHoverState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((person) => (
          <TableRow key={person.id}>
            <TableCell>{person.id}</TableCell>
            <TableCell>{person.name}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>{person.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithSelectedRow: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((person, index) => (
          <TableRow key={person.id} data-state={index === 1 ? 'selected' : ''}>
            <TableCell>{person.name}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>{person.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const MinimalTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Cell 1</TableCell>
          <TableCell>Cell 2</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cell 3</TableCell>
          <TableCell>Cell 4</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithManyColumns: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>First Name</TableHead>
          <TableHead>Last Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>1</TableCell>
          <TableCell>Alice</TableCell>
          <TableCell>Johnson</TableCell>
          <TableCell>alice@example.com</TableCell>
          <TableCell>Admin</TableCell>
          <TableCell>Active</TableCell>
          <TableCell>2024-01-15</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>2</TableCell>
          <TableCell>Bob</TableCell>
          <TableCell>Smith</TableCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>User</TableCell>
          <TableCell>Active</TableCell>
          <TableCell>2024-02-20</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>3</TableCell>
          <TableCell>Carol</TableCell>
          <TableCell>White</TableCell>
          <TableCell>carol@example.com</TableCell>
          <TableCell>Editor</TableCell>
          <TableCell>Inactive</TableCell>
          <TableCell>2024-03-10</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Short title</TableCell>
          <TableCell>
            This is a very long description that demonstrates how the table
            handles long content. The whitespace-nowrap class keeps content on a
            single line.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Another title</TableCell>
          <TableCell>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const EmptyTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-current/70">
            No data available
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithAlignment: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Left</TableHead>
          <TableHead className="text-center">Center</TableHead>
          <TableHead className="text-right">Right</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell className="text-left">Left aligned</TableCell>
            <TableCell className="text-center">Center aligned</TableCell>
            <TableCell className="text-right">Right aligned</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((person) => (
            <TableRow key={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
