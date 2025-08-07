import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useRef, useState } from 'react';
import MVPList from './MVPList';

const meta: Meta<typeof MVPList> = {
  title: 'Components/MVPList',
  component: MVPList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Function to generate items with unique IDs
const generateItems = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    name: faker.person.firstName(),
  }));

export const Default: Story = {
  args: {
    items: generateItems(1000),
    listId: '0', // provide a stable listId for default story
  },
};

export const WithRegenerateButton: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(1000));
    const listIdRef = useRef(0);

    const handleRegenerate = () => {
      // Generate new items with different IDs to ensure they're treated as new
      setItems(generateItems(Math.floor(Math.random() * 1000), Date.now()));
      listIdRef.current += 1; // Increment listId to trigger animation
    };

    return (
      <div>
        <button
          type="button"
          onClick={handleRegenerate}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Regenerate Items
        </button>
        <MVPList items={items} listId={listIdRef.current.toString()} />
      </div>
    );
  },
};

export const StableListId: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(10));
    const listIdRef = useRef(0);

    const addItem = () => {
      // Add a new item without changing listId (no full animation)
      const maxId = items.length > 0 ? Math.max(...items.map((i) => i.id)) : 0;
      setItems([...items, { id: maxId + 1, name: faker.person.firstName() }]);
      // Note: listId not changed, so no full list animation triggered
    };

    const removeItem = () => {
      // Remove last item without changing listId
      if (items.length === 0) return;
      setItems(items.slice(0, items.length - 1));
      // listId stays the same
    };

    return (
      <div>
        <div style={{ marginBottom: '12px' }}>
          <button
            type="button"
            onClick={addItem}
            className="bg-success mr-2 rounded px-4 py-2 text-white hover:cursor-pointer"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={removeItem}
            className="bg-destructive rounded px-4 py-2 text-white hover:cursor-pointer"
          >
            Remove Item
          </button>
          <p className="text-sm">
            Note: listId is stable, so adding/removing items does{' '}
            <strong>not</strong> re-trigger full animation. This is useful in
            cases like drag and drop.
          </p>
        </div>
        <MVPList items={items} listId={listIdRef.current.toString()} />
      </div>
    );
  },
};
