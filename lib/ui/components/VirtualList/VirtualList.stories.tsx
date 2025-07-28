import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { VirtualList, type LayoutConfig } from './index';
import { DndStoreProvider, useDropTarget } from '~/lib/dnd';

type MockItem = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const mockItems: MockItem[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `item-${i}`,
  name: `Item ${i + 1}`,
  description: `This is the description for item ${i + 1}`,
  color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726'][i % 5]!,
}));

const ItemComponent = ({ item, style }: { item: MockItem; style?: React.CSSProperties }) => (
  <div
    style={{
      ...style,
      backgroundColor: item.color,
      border: '2px solid #fff',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      color: 'white',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}
  >
    <div style={{ fontSize: '14px' }}>{item.name}</div>
  </div>
);

const EmptyComponent = () => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center', 
    color: '#666',
    fontSize: '18px'
  }}>
    No items to display
  </div>
);

// Drop target component for the drag and drop story
const DropTarget = ({ onDrop, droppedItems }: { 
  onDrop: (metadata: any) => void; 
  droppedItems: MockItem[];
}) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'story-drop-target',
    accepts: ['mock-item'],
    announcedName: 'Drop target for virtual list items',
    onDrop,
  });

  return (
    <div
      {...dropProps}
      style={{
        flex: 1,
        minHeight: '200px',
        border: '2px dashed',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s',
        borderColor: isOver && willAccept ? '#2196f3' : '#ccc',
        backgroundColor: isOver && willAccept ? '#e3f2fd' : '#f9f9f9',
      }}
    >
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        Drop items here ({droppedItems.length} items)
      </div>
      {droppedItems.map((item, index) => (
        <div
          key={`${item.id}-${index}`}
          style={{
            padding: '8px 12px',
            backgroundColor: item.color,
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {item.name}
        </div>
      ))}
      {droppedItems.length === 0 && (
        <div style={{ 
          fontSize: '14px', 
          color: '#999', 
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: '60px'
        }}>
          Drag items here from the list
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof VirtualList> = {
  title: 'Components/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A virtualized list component with multiple layout modes for performance with large datasets.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ 
        height: '100vh', 
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box',
        minWidth: '1200px',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
      }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VirtualList>;

// Phase 1: Basic fixed height (legacy mode)
export const FixedHeight: Story = {
  args: {
    items: mockItems.slice(0, 100),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    itemHeight: 80,
    ariaLabel: 'Fixed height virtual list',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Phase 1 compatibility mode using fixed item height. This is the legacy API.',
      },
    },
  },
};

// Phase 2: Grid Layout
export const GridLayout: Story = {
  args: {
    items: mockItems.slice(0, 1000),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'grid',
      itemSize: { width: 120, height: 120 },
      gap: 16,
    },
    ariaLabel: 'Grid layout virtual list',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid layout that automatically calculates items per row based on container width. Ideal for card-like items.',
      },
    },
  },
};

// Phase 2: Column Layout
export const ColumnLayout: Story = {
  args: {
    items: mockItems.slice(0, 500),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'columns',
      columns: 3,
      gap: 12,
      itemHeight: 100,
    },
    ariaLabel: 'Column layout virtual list',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fixed number of columns where each item spans 100% of column width. Good for uniform content.',
      },
    },
  },
};

// Phase 2: Horizontal Layout
export const HorizontalLayout: Story = {
  args: {
    items: mockItems.slice(0, 200),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'horizontal',
      itemHeight: 150,
      itemWidth: 120,
      gap: 16,
    },
    ariaLabel: 'Horizontal layout virtual list',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Horizontal scrolling layout for carousel-like interfaces.',
      },
    },
  },
};


// Large Dataset Performance Test
export const LargeDataset: Story = {
  args: {
    items: mockItems, // Full 10,000 items
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'grid',
      itemSize: { width: 100, height: 100 },
      gap: 8,
    },
    ariaLabel: 'Large dataset virtual list (10,000 items)',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance test with 10,000 items. Should scroll smoothly thanks to virtualization.',
      },
    },
  },
};

// Phase 3: Animations
export const WithAnimations: Story = {
  args: {
    items: mockItems.slice(0, 100),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'grid',
      itemSize: { width: 120, height: 120 },
      gap: 16,
    },
    animation: {
      enabled: true,
      stagger: 0.03,
      duration: 0.4,
      easing: 'easeOut',
      initial: { opacity: 0, scale: 0.8, y: '-10%' },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.8, y: '-10%' },
    },
    ariaLabel: 'Animated virtual list',
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Phase 3 - Staggered entry/exit animations with customizable timing and effects.',
      },
    },
  },
};

// Phase 4: Drag & Drop (with DndStoreProvider)
export const WithDragAndDrop: Story = {
  render: () => {
    const [droppedItems, setDroppedItems] = useState<MockItem[]>([]);

    const handleDrop = (metadata: any) => {
      console.log('Item dropped in target:', metadata);
      if (metadata?.item) {
        setDroppedItems(prev => [...prev, metadata.item as MockItem]);
      }
    };

    return (
      <DndStoreProvider>
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
          {/* Source list */}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Draggable Items</h3>
            <VirtualList
              items={mockItems.slice(0, 50)}
              keyExtractor={(item) => (item as MockItem).id}
              renderItem={({ item, style }) => <ItemComponent item={item as MockItem} style={style} />}
              layout={{
                mode: 'columns',
                columns: 1,
                gap: 12,
                itemHeight: 80,
              }}
              animation={{
                enabled: true,
                stagger: 0.02,
                duration: 0.3,
                easing: 'easeOut',
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 },
              }}
              // Drag & Drop props
              draggable={true}
              droppable={true}
              itemType="mock-item"
              accepts={['mock-item']}
              getDragMetadata={(item) => ({ item: item as MockItem })}
              onDrop={(metadata) => console.log('Dropped within list:', metadata)}
              ariaLabel="Draggable virtual list"
              onItemClick={(item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index)}
            />
          </div>

          {/* Drop target */}
          <div style={{ 
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: '0', fontSize: '16px' }}>Drop Target</h3>
            <DropTarget onDrop={handleDrop} droppedItems={droppedItems} />
            <button
              onClick={() => setDroppedItems([])}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Drop Target
            </button>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Phase 4 - Drag and drop integration with DndStoreProvider. Items can be dragged from the list and dropped into the target area on the right.',
      },
    },
  },
};

// Phase 5: Accessibility & Selection
export const WithAccessibility: Story = {
  args: {
    items: mockItems.slice(0, 100),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => <ItemComponent item={item as MockItem} style={style} />,
    layout: {
      mode: 'grid',
      itemSize: { width: 120, height: 120 },
      gap: 16,
    },
    // Accessibility props
    ariaLabel: 'Accessible virtual list with keyboard navigation',
    role: 'list',
    multiSelect: true,
    onItemSelect: (items) => console.log('Selected items:', items.map(item => (item as MockItem).name)),
    onItemClick: (item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Phase 5 - Full accessibility support with keyboard navigation and multi-selection. Use arrow keys to navigate, Enter/Space to select.',
      },
    },
  },
};

// Interactive Layout Switcher
export const InteractiveLayoutSwitcher: Story = {
  render: () => {
    const [layoutMode, setLayoutMode] = useState<LayoutConfig['mode']>('grid');
    const [itemCount, setItemCount] = useState(500);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [columnCount, setColumnCount] = useState(4);
    
    const getLayout = (): LayoutConfig => {
      switch (layoutMode) {
        case 'grid':
          return { mode: 'grid', itemSize: { width: 120, height: 120 }, gap: 16 };
        case 'columns':
          return { mode: 'columns', columns: columnCount, gap: 12, itemHeight: 100 };
        case 'horizontal':
          return { mode: 'horizontal', itemHeight: 150, itemWidth: 120, gap: 16 };
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #eee',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ marginRight: '8px' }}>Layout:</label>
            <select 
              value={layoutMode} 
              onChange={(e) => setLayoutMode(e.target.value as LayoutConfig['mode'])}
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

          <div>
            <label style={{ marginRight: '8px' }}>
              <input
                type="checkbox"
                checked={animationsEnabled}
                onChange={(e) => setAnimationsEnabled(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              Animations
            </label>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <VirtualList
            items={mockItems.slice(0, itemCount)}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => <ItemComponent item={item as MockItem} style={style} />}
            layout={getLayout()}
            animation={animationsEnabled ? {
              enabled: true,
              stagger: 0.02,
              duration: 0.3,
              easing: 'easeOut',
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.9 },
            } : { enabled: false, stagger: 0, duration: 0, easing: 'linear' }}
            ariaLabel={`Interactive ${layoutMode} layout virtual list`}
            onItemClick={(item, index) => console.log('Clicked:', (item as MockItem).name, 'at index', index)}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with layout switching, item count adjustment, and animation toggle.',
      },
    },
  },
};