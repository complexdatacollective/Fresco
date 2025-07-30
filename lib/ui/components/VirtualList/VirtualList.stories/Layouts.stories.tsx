import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { VirtualList, type LayoutConfig } from '../index';
import { mockItems, ItemComponent, type MockItem } from './shared';

const meta: Meta<typeof VirtualList> = {
  title: 'Components/VirtualList/Layouts',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates different layout modes supported by VirtualList.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VirtualList>;

export const InteractiveLayoutSwitcher: Story = {
  render: () => {
    const [layoutMode, setLayoutMode] = useState<LayoutConfig['mode']>('grid');
    const [itemCount, setItemCount] = useState(500);
    const [columnCount, setColumnCount] = useState(4);

    const getLayout = (): LayoutConfig => {
      switch (layoutMode) {
        case 'grid':
          return {
            mode: 'grid',
            itemSize: { width: 120, height: 120 },
            gap: 16,
          };
        case 'columns':
          return {
            mode: 'columns',
            columns: columnCount,
            gap: 12,
            itemHeight: 120,
          };
        case 'horizontal':
          return {
            mode: 'horizontal',
            itemHeight: 150,
            itemWidth: 120,
            gap: 16,
          };
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label style={{ marginRight: '8px' }}>Layout:</label>
            <select
              value={layoutMode}
              onChange={(e) =>
                setLayoutMode(e.target.value as LayoutConfig['mode'])
              }
              style={{ padding: '4px 8px' }}
            >
              <option value="grid">Grid</option>
              <option value="columns">Columns</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '8px' }}>Items:</label>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={itemCount}
              onChange={(e) => setItemCount(Number(e.target.value))}
              style={{ marginRight: '8px' }}
            />
            <span>{itemCount}</span>
          </div>

          {layoutMode === 'columns' && (
            <div>
              <label style={{ marginRight: '8px' }}>Columns:</label>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={columnCount}
                onChange={(e) => setColumnCount(Number(e.target.value))}
                style={{ marginRight: '8px' }}
              />
              <span>{columnCount}</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <VirtualList
            items={mockItems.slice(0, itemCount)}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <ItemComponent item={item as MockItem} style={style} />
            )}
            layout={getLayout()}
            ariaLabel={`Interactive ${layoutMode} layout virtual list`}
            onItemClick={(item, index) =>
              console.log(
                'Clicked:',
                (item as MockItem).name,
                'at index',
                index,
              )
            }
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo allowing you to switch between layout modes and adjust parameters in real-time.',
      },
    },
  },
};