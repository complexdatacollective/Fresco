import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DndStoreProvider, useDropTarget } from '~/lib/dnd';
import { VirtualList, type LayoutConfig } from './index';

type MockItem = {
  id: string;
  name: string;
};

const mockItems: MockItem[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `item-${i}`,
  name: `Item ${i + 1}`,
}));

const ItemComponent = ({
  item,
  style,
}: {
  item: MockItem;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      ...style,
      backgroundColor: '#f5f5f5',
      border: '2px solid #fff',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '14px' }}>{item.name}</div>
  </div>
);

const EmptyComponent = () => (
  <div
    style={{
      padding: '40px',
      textAlign: 'center',
      color: '#666',
      fontSize: '18px',
    }}
  >
    No items to display
  </div>
);

// Drop target component for the drag and drop story
const DropTarget = ({
  onDrop,
  droppedItems,
}: {
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
            backgroundColor: '#2196f3',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {item.name}
        </div>
      ))}
      {droppedItems.length === 0 && (
        <div
          style={{
            fontSize: '14px',
            color: '#999',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '60px',
          }}
        >
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
        component:
          'A virtualized list component with multiple layout modes for performance with large datasets.',
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
          // minWidth: '12px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VirtualList>;

export const WithDragAndDrop: Story = {
  render: () => {
    const [droppedItems, setDroppedItems] = useState<MockItem[]>([]);

    const handleDrop = (metadata: any) => {
      console.log('Item dropped in target:', metadata);
      if (metadata?.item) {
        setDroppedItems((prev) => [...prev, metadata.item as MockItem]);
      }
    };

    return (
      <DndStoreProvider>
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
          {/* Source list */}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
              Draggable Items
            </h3>
            <VirtualList
              items={mockItems.slice(0, 50)}
              keyExtractor={(item) => (item as MockItem).id}
              renderItem={({ item, style }) => (
                <ItemComponent item={item as MockItem} style={style} />
              )}
              layout={{
                mode: 'columns',
                columns: 1,
                gap: 12,
                itemHeight: 80,
              }}
              // Drag & Drop props
              draggable={true}
              droppable={true}
              itemType="mock-item"
              accepts={['mock-item']}
              getDragMetadata={(item) => ({ item: item as MockItem })}
              onDrop={(metadata) =>
                console.log('Dropped within list:', metadata)
              }
              ariaLabel="Draggable virtual list"
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

          {/* Drop target */}
          <div
            style={{
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
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
                fontSize: '14px',
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
        story:
          'Phase 4 - Drag and drop integration with DndStoreProvider. Items can be dragged from the list and dropped into the target area on the right.',
      },
    },
  },
};

export const WithAccessibility: Story = {
  args: {
    items: mockItems.slice(0, 100),
    keyExtractor: (item) => (item as MockItem).id,
    renderItem: ({ item, style }) => (
      <ItemComponent item={item as MockItem} style={style} />
    ),
    layout: {
      mode: 'grid',
      itemSize: { width: 120, height: 120 },
      gap: 16,
    },
    // Accessibility props
    ariaLabel: 'Accessible virtual list with keyboard navigation',
    role: 'list',
    multiSelect: true,
    onItemSelect: (items) =>
      console.log(
        'Selected items:',
        items.map((item) => (item as MockItem).name),
      ),
    onItemClick: (item, index) =>
      console.log('Clicked:', (item as MockItem).name, 'at index', index),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Phase 5 - Full accessibility support with keyboard navigation and multi-selection. Use arrow keys to navigate, Enter/Space to select.',
      },
    },
  },
};

// Interactive Layout Switcher
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
            itemHeight: 100,
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
          'Interactive demo with layout switching and item count adjustment.',
      },
    },
  },
};

// Selection with Visual Feedback
export const WithSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleItemClick = (item: MockItem, index: number) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    };

    const SelectableItemComponent = ({
      item,
      style,
      isSelected,
    }: {
      item: MockItem;
      style?: React.CSSProperties;
      isSelected: boolean;
    }) => (
      <div
        style={{
          ...style,
          backgroundColor: isSelected ? '#2196f3' : '#f5f5f5',
          color: isSelected ? 'white' : 'black',
          border: `2px solid ${isSelected ? '#1976d2' : '#fff'}`,
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'scale(0.98)' : 'scale(1)',
          boxShadow: isSelected
            ? '0 2px 8px rgba(33, 150, 243, 0.3)'
            : '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: isSelected ? 'bold' : 'normal',
          }}
        >
          {item.name}
        </div>
        {isSelected && (
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
            ✓ Selected
          </div>
        )}
      </div>
    );

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              Click to Select Items
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              Click items to select/deselect them. Selected: {selectedIds.size}
            </p>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Clear Selection
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <VirtualList
            items={mockItems.slice(0, 200)}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <SelectableItemComponent
                item={item as MockItem}
                style={style}
                isSelected={selectedIds.has((item as MockItem).id)}
              />
            )}
            layout={{
              mode: 'columns',
              columns: 4,
              gap: 12,
              itemHeight: 100,
            }}
            ariaLabel="Selectable virtual list"
            onItemClick={handleItemClick}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates onClick functionality with visual selection state. Click items to select/deselect them and see the visual feedback.',
      },
    },
  },
};
