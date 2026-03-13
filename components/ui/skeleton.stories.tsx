import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes for sizing and styling',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'h-4 w-48',
  },
};

export const Shapes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-current/70">Rectangle</span>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-current/70">Square</span>
        <Skeleton className="size-12" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-current/70">Circle</span>
        <Skeleton className="size-12 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-current/70">Pill</span>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  ),
};

export const TextPlaceholder: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
};

export const CardPlaceholder: Story = {
  render: () => (
    <div className="bg-surface-1 w-72 rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  ),
};

export const TableRowPlaceholder: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  ),
};

export const FormPlaceholder: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full rounded" />
      </div>
      <Skeleton className="h-10 w-24 rounded" />
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Skeleton className="size-10 rounded-full ring-2 ring-white" />
      <Skeleton className="size-10 rounded-full ring-2 ring-white" />
      <Skeleton className="size-10 rounded-full ring-2 ring-white" />
      <Skeleton className="size-10 rounded-full ring-2 ring-white" />
    </div>
  ),
};
