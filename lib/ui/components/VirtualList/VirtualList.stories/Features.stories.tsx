import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DndStoreProvider } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import { VirtualList } from '../index';
import { mockItems, ItemComponent, SelectableItemComponent, DropTarget, type MockItem } from './shared';

const meta: Meta<typeof VirtualList> = {
  title: 'Components/VirtualList/Features',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive features: selection, drag & drop, animations, and accessibility.',
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

    const handleDrop = (metadata: unknown) => {
      console.log('Item dropped in target:', metadata);
      if (metadata && typeof metadata === 'object' && 'item' in metadata) {
        setDroppedItems((prev) => [...prev, metadata.item as MockItem]);
      }
    };

    return (
      <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
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
          'Drag and drop integration. Items can be dragged from the list and dropped into the target area.',
      },
    },
  },
};

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
          'Demonstrates onClick functionality with visual selection state.',
      },
    },
  },
};

export const WithDefaultAnimations: Story = {
  render: () => {
    const [items, setItems] = useState<MockItem[]>(mockItems.slice(0, 50));

    const refreshItems = () => {
      const newItems = Array.from({ length: 50 }, (_, i) => ({
        id: `refresh-${Date.now()}-${i}`,
        name: `New Item ${i + 1}`,
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
          <h3>Default Staggered Animations</h3>
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
            layout={{
              mode: 'grid',
              itemSize: { width: 180, height: 120 },
              gap: 12,
            }}
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
          'Demonstrates the default staggered animations. Click "Refresh Items" to see the enter animations.',
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
          'Demonstrates custom animations with slide and rotate effects.',
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
          This example shows the list without animations for maximum performance.
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
          'Shows the VirtualList without animations for optimal performance.',
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
          'Demonstrates multi-selection with accessibility features. Includes keyboard navigation and proper ARIA attributes.',
      },
    },
  },
};

