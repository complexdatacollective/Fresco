import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout/ListLayout';
import { type CollectionProps } from '../types';

/**
 * The Collection component renders a list of items with support for
 * selection, keyboard navigation, and drag-and-drop.
 *
 * Features:
 * - Basic list rendering from an array of items
 * - Key extraction for item identification
 * - Text value extraction for accessibility
 * - Empty state handling
 * - Selection (single/multiple modes)
 * - Layout system (list/grid)
 * - Keyboard navigation
 * - Drag and drop
 */
const meta: Meta<typeof Collection> = {
  title: 'Systems/Collection/Collection',
  component: Collection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A collection component with support for flexible layouts,
selection, keyboard navigation, and drag-and-drop.

### Usage

\`\`\`tsx
import { Collection } from '~/lib/collection';

<Collection
  items={users}
  keyExtractor={(user) => user.id}
  renderItem={(user) => <div>{user.name}</div>}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data types
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Task = {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
};

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Developer',
  },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer' },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'Manager',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Developer',
  },
  {
    id: '5',
    name: 'Eva Martinez',
    email: 'eva@example.com',
    role: 'QA Engineer',
  },
];

const sampleTasks: Task[] = [
  { id: 1, title: 'Review pull request', completed: false, priority: 'high' },
  { id: 2, title: 'Update documentation', completed: true, priority: 'low' },
  { id: 3, title: 'Fix login bug', completed: false, priority: 'high' },
  { id: 4, title: 'Add unit tests', completed: false, priority: 'medium' },
  { id: 5, title: 'Deploy to staging', completed: true, priority: 'medium' },
];

// Helper to render stories with proper types
function UserCollection(props: Partial<Omit<CollectionProps<User>, 'layout'>>) {
  const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
  return (
    <Collection<User>
      items={sampleUsers}
      keyExtractor={(user) => user.id}
      layout={layout}
      renderItem={(user) => (
        <div className="border-border bg-card rounded-md border p-3">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground text-sm">{user.email}</div>
        </div>
      )}
      {...props}
    />
  );
}

/**
 * Basic example showing a list of users with simple styling.
 */
export const Default: Story = {
  render: () => <UserCollection />,
};
