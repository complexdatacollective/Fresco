import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DndStoreProvider, useDropTarget } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
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
    }}
    className="bg-navy-taupe focus:ring-accent focus:ring-offset-background m-2 rounded-lg px-4 py-6 text-white transition-opacity duration-200 select-none focus:ring-2 focus:ring-offset-2 focus:outline-none"
  >
    {item.name}
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
      <DndStoreProvider>
        <div
          style={{
            height: '100vh',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box',
            // minWidth: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
          }}
        >
          <Story />
        </div>
      </DndStoreProvider>
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
              itemHeight: 120,
            }}
            // Drag & Drop props
            draggable={true}
            droppable={true}
            itemType="mock-item"
            accepts={['mock-item']}
            getDragMetadata={(item) => ({ item: item as MockItem })}
            onDrop={(metadata) => console.log('Dropped within list:', metadata)}
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
        }}
        className={cn(
          'm-2 cursor-pointer rounded-lg px-4 py-3 text-white transition-opacity duration-200 select-none',
          'focus:ring-accent focus:ring-offset-background focus:ring-2 focus:ring-offset-2 focus:outline-none',
          isSelected ? 'bg-accent' : 'bg-navy-taupe',
          isSelected &&
            'ring-2 ring-white ring-offset-2 ring-offset-transparent',
        )}
      >
        <div
          style={{
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
              itemHeight: 120,
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

export const WithDefaultAnimations: Story = {
  render: () => {
    const [items, setItems] = useState<MockItem[]>(mockItems.slice(0, 50));
    const [layoutMode, setLayoutMode] = useState<
      'grid' | 'columns' | 'horizontal'
    >('grid');

    const refreshItems = () => {
      // Create new items to trigger enter animations
      const newItems = Array.from({ length: 50 }, (_, i) => ({
        id: `refresh-${Date.now()}-${i}`,
        name: `New Item ${i + 1}`,
      }));
      setItems(newItems);
    };

    const getLayout = (): LayoutConfig => {
      switch (layoutMode) {
        case 'grid':
          return {
            mode: 'grid',
            itemSize: { width: 180, height: 120 },
            gap: 12,
          };
        case 'columns':
          return {
            mode: 'columns',
            columns: 3,
            gap: 12,
            itemHeight: 120,
          };
        case 'horizontal':
          return {
            mode: 'horizontal',
            itemWidth: 200,
            itemHeight: 150,
            gap: 12,
          };
      }
    };

    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          <label>Layout Mode:</label>
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as any)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="grid">Grid</option>
            <option value="columns">Columns</option>
            <option value="horizontal">Horizontal</option>
          </select>
          <button
            onClick={refreshItems}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #007acc',
              backgroundColor: '#007acc',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Refresh Items (Trigger Animations)
          </button>
        </div>

        <div
          style={{
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <VirtualList
            items={items}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <ItemComponent item={item as MockItem} style={style} />
            )}
            layout={getLayout()}
            animations={{
              enter: {
                keyframes: {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px) scale(0.95)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0px) scale(1)',
                  },
                },
                timing: {
                  duration: 300,
                  delay: 0,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                },
                stagger: 50,
              },
              exit: {
                keyframes: {
                  from: {
                    opacity: 1,
                    transform: 'translateY(0px) scale(1)',
                  },
                  to: {
                    opacity: 0,
                    transform: 'translateY(-10px) scale(0.95)',
                  },
                },
                timing: {
                  duration: 200,
                  delay: 0,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                },
                stagger: 25,
              },
            }}
            ariaLabel="Virtual list with default animations"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the default staggered nodelist animations. Items fade in from below with a slight scale effect and staggered timing. Click "Refresh Items" to see the enter animations.',
      },
    },
  },
};

export const WithCustomAnimations: Story = {
  render: () => {
    const [items, setItems] = useState<MockItem[]>(mockItems.slice(0, 30));

    const refreshItems = () => {
      const newItems = Array.from({ length: 30 }, (_, i) => ({
        id: `custom-${Date.now()}-${i}`,
        name: `Custom Item ${i + 1}`,
      }));
      setItems(newItems);
    };

    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          <h3>Custom Slide & Rotate Animation</h3>
          <button
            onClick={refreshItems}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #28a745',
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Refresh Items
          </button>
        </div>

        <div
          style={{
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <VirtualList
            items={items}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <ItemComponent item={item as MockItem} style={style} />
            )}
            layout={{
              mode: 'grid',
              itemSize: { width: 200, height: 140 },
              gap: 16,
            }}
            animations={{
              enter: {
                keyframes: {
                  from: {
                    opacity: 0,
                    transform: 'translateX(-30px) rotate(-5deg) scale(0.8)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateX(0px) rotate(0deg) scale(1)',
                  },
                },
                timing: {
                  duration: 400,
                  delay: 0,
                  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                },
                stagger: 80,
              },
              exit: {
                keyframes: {
                  from: {
                    opacity: 1,
                    transform: 'translateX(0px) rotate(0deg) scale(1)',
                  },
                  to: {
                    opacity: 0,
                    transform: 'translateX(30px) rotate(5deg) scale(0.8)',
                  },
                },
                timing: {
                  duration: 300,
                  delay: 0,
                  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                },
                stagger: 40,
              },
            }}
            ariaLabel="Virtual list with custom animations"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates custom animations with slide and rotate effects. Items slide in from the left with rotation and bounce easing, creating a more playful entrance effect.',
      },
    },
  },
};

export const WithoutAnimations: Story = {
  render: () => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ padding: '0 8px' }}>
        <h3>No Animations (Performance Mode)</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          This example shows the list without animations for maximum performance
          with large datasets.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <VirtualList
          items={mockItems.slice(0, 200)}
          keyExtractor={(item) => (item as MockItem).id}
          renderItem={({ item, style }) => (
            <ItemComponent item={item as MockItem} style={style} />
          )}
          layout={{
            mode: 'columns',
            columns: 4,
            gap: 8,
            itemHeight: 120,
          }}
          ariaLabel="Virtual list without animations"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the VirtualList without animations. When the animations prop is omitted, the component renders items immediately for optimal performance.',
      },
    },
  },
};

export const WithAccessibility: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const handleItemSelect = (items: MockItem[]) => {
      const newSelection = new Set(items.map((item) => item.id));
      setSelectedItems(newSelection);
    };

    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Accessibility Demo
          </h3>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Keyboard Navigation:</strong> Tab to focus, arrow keys to
              navigate, Enter/Space to select
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Screen Reader:</strong> Uses proper ARIA attributes and
              roles
            </p>
            <p style={{ margin: '0' }}>
              <strong>Selection:</strong> {selectedItems.size} items selected
            </p>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <div
            id="accessibility-description"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}
          >
            This is an accessible virtual list with keyboard navigation support.
            Use arrow keys to navigate between items, and Enter or Space to
            select items. Tab key focuses the list.
          </div>
          <div
            style={{
              flex: 1,
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <VirtualList
              items={mockItems.slice(0, 100)}
              keyExtractor={(item) => (item as MockItem).id}
              renderItem={({ item, style }) => {
                const isSelected = selectedItems.has((item as MockItem).id);
                return (
                  <div
                    style={{
                      ...style,
                    }}
                    className={cn(
                      'm-2 cursor-pointer rounded-lg px-4 py-6 text-white transition-opacity duration-200 select-none',
                      'focus:ring-accent focus:ring-offset-background focus:ring-2 focus:ring-offset-2 focus:outline-none',
                      isSelected ? 'bg-accent' : 'bg-navy-taupe',
                      isSelected &&
                        'ring-2 ring-white ring-offset-2 ring-offset-transparent',
                    )}
                  >
                    <div
                      style={{
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }}
                    >
                      {(item as MockItem).name}
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          fontSize: '12px',
                          marginTop: '4px',
                          opacity: 0.9,
                        }}
                      >
                        ✓ Selected
                      </div>
                    )}
                  </div>
                );
              }}
              layout={{
                mode: 'columns',
                columns: 2,
                gap: 8,
                itemHeight: 120,
              }}
              ariaLabel="Accessible virtual list with keyboard navigation and selection"
              ariaDescribedBy="accessibility-description"
              role="list"
              multiSelect={true}
              focusable={true}
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
              onItemClick={(item, index) => {
                console.log(
                  'Item clicked:',
                  (item as MockItem).name,
                  'at index',
                  index,
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates full accessibility features including keyboard navigation, ARIA attributes, focus management, and multi-selection. Use the Storybook a11y addon panel to check for accessibility violations.',
      },
    },
  },
};

export const AnimationComparison: Story = {
  render: () => {
    const [leftItems, setLeftItems] = useState<MockItem[]>(
      mockItems.slice(0, 20),
    );
    const [rightItems, setRightItems] = useState<MockItem[]>(
      mockItems.slice(0, 20),
    );

    const refreshLeft = () => {
      const newItems = Array.from({ length: 20 }, (_, i) => ({
        id: `left-${Date.now()}-${i}`,
        name: `With Animation ${i + 1}`,
      }));
      setLeftItems(newItems);
    };

    const refreshRight = () => {
      const newItems = Array.from({ length: 20 }, (_, i) => ({
        id: `right-${Date.now()}-${i}`,
        name: `No Animation ${i + 1}`,
      }));
      setRightItems(newItems);
    };

    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ padding: '0 8px' }}>
          <h3>Animation vs No Animation Comparison</h3>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4>With Animations</h4>
              <button
                onClick={refreshLeft}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #007acc',
                  backgroundColor: '#007acc',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
            <div
              style={{
                flex: 1,
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <VirtualList
                items={leftItems}
                keyExtractor={(item) => (item as MockItem).id}
                renderItem={({ item, style }) => (
                  <ItemComponent item={item as MockItem} style={style} />
                )}
                layout={{
                  mode: 'columns',
                  columns: 2,
                  gap: 8,
                  itemHeight: 120,
                }}
                animations={{
                  enter: {
                    keyframes: {
                      from: { opacity: 0, transform: 'translateY(15px)' },
                      to: { opacity: 1, transform: 'translateY(0px)' },
                    },
                    timing: { duration: 250, delay: 0 },
                    stagger: 40,
                  },
                }}
                ariaLabel="Virtual list with animations"
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4>Without Animations</h4>
              <button
                onClick={refreshRight}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #6c757d',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
            <div
              style={{
                flex: 1,
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <VirtualList
                items={rightItems}
                keyExtractor={(item) => (item as MockItem).id}
                renderItem={({ item, style }) => (
                  <ItemComponent item={item as MockItem} style={style} />
                )}
                layout={{
                  mode: 'columns',
                  columns: 2,
                  gap: 8,
                  itemHeight: 120,
                }}
                ariaLabel="Virtual list without animations"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison showing the same content with and without animations. Refresh either side to see the difference in how items appear.',
      },
    },
  },
};
