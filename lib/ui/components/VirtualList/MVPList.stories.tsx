import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
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
  },
};

export const WithRegenerateButton: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(1000));

    const handleRegenerate = () => {
      // Generate new items with different IDs to ensure they're treated as new
      setItems(generateItems(1000, Date.now()));
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
        <MVPList items={items} />
      </div>
    );
  },
};
