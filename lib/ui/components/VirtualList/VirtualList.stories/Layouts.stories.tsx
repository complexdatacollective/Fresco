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

export const SpacingConfiguration: Story = {
  render: () => {
    const [gap, setGap] = useState(12);
    const [layoutMode, setLayoutMode] = useState<LayoutConfig['mode']>('grid');

    const getLayout = (): LayoutConfig => {
      switch (layoutMode) {
        case 'grid':
          return {
            mode: 'grid',
            itemSize: { width: 140, height: 140 },
            gap, // Dynamic gap configuration
          };
        case 'columns':
          return {
            mode: 'columns',
            columns: 3,
            gap, // Dynamic gap configuration
            itemHeight: 140,
          };
        case 'horizontal':
          return {
            mode: 'horizontal',
            itemHeight: 140,
            itemWidth: 140,
            gap, // Dynamic gap configuration
          };
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
            Spacing Configuration Demo
          </h3>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <label style={{ marginRight: '8px', fontWeight: '500' }}>
                Layout Mode:
              </label>
              <select
                value={layoutMode}
                onChange={(e) =>
                  setLayoutMode(e.target.value as LayoutConfig['mode'])
                }
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value="grid">Grid Layout</option>
                <option value="columns">Columns Layout</option>
                <option value="horizontal">Horizontal Layout</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontWeight: '500' }}>Gap Size:</label>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                style={{ minWidth: '120px' }}
              />
              <span
                style={{
                  minWidth: '40px',
                  padding: '4px 8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              >
                {gap}px
              </span>
            </div>
          </div>

          {/* Spacing documentation */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
          >
            <strong>How gap works in {layoutMode} mode:</strong>
            <br />
            {layoutMode === 'grid' && (
              <>
                • Gap applies between all items horizontally and vertically
                <br />• Items auto-arrange in a responsive grid based on
                container width
              </>
            )}
            {layoutMode === 'columns' && (
              <>
                • Gap applies between items in the same row and between rows
                <br />• Fixed number of columns (
                {getLayout().mode === 'columns'
                  ? (getLayout() as any).columns
                  : 3}
                ) with equal width distribution
              </>
            )}
            {layoutMode === 'horizontal' && (
              <>
                • Gap applies between items horizontally only
                <br />• Items scroll horizontally with fixed width and height
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {/* Visual spacing guides */}
          {gap > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 123, 204, 0.9)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 10,
              }}
            >
              Current spacing: <strong>{gap}px</strong>
            </div>
          )}

          <VirtualList
            items={mockItems.slice(0, 120)} // Fixed number for consistent comparison
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <div
                style={{
                  ...style,
                  // Add visual indicator for spacing
                  border:
                    gap > 0 ? '1px dashed rgba(0, 123, 204, 0.3)' : 'none',
                }}
              >
                <ItemComponent
                  item={item as MockItem}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
            layout={getLayout()}
            ariaLabel={`${layoutMode} layout with ${gap}px spacing`}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive spacing configuration demo. Adjust the gap value to see how spacing affects different layout modes. Visual guides show the spacing areas between items.',
      },
    },
  },
};
