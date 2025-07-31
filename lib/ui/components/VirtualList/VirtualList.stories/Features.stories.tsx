import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DndStoreProvider } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import { VirtualList } from '../index';
import {
  mockItems,
  ItemComponent,
  SelectableItemComponent,
  DropTarget,
  type MockItem,
} from './shared';

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
    // State management for drag and drop functionality
    // sourceItems: Items available for dragging
    // droppedItems: Items that have been successfully dropped
    const [sourceItems, setSourceItems] = useState<MockItem[]>(() =>
      mockItems.slice(0, 50),
    );
    const [droppedItems, setDroppedItems] = useState<MockItem[]>([]);

    // Drop handler: Called when items are dropped into the DropTarget component
    // The metadata parameter contains the drag data set by getDragMetadata
    const handleDrop = (metadata: unknown) => {
      console.log('Item dropped in target:', metadata);
      if (metadata && typeof metadata === 'object' && 'item' in metadata) {
        const droppedItem = metadata.item as MockItem;
        // Remove item from source list (creates smooth exit animation)
        setSourceItems((prev) =>
          prev.filter((item) => item.id !== droppedItem.id),
        );
        // Add item to dropped items collection
        setDroppedItems((prev) => [...prev, droppedItem]);
      }
    };

    return (
      <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            Draggable Items
          </h3>
          <VirtualList
            // Core props
            items={sourceItems}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <ItemComponent item={item as MockItem} style={style} />
            )}
            // Layout configuration: Single column for vertical list
            layout={{
              mode: 'columns', // Use columns mode for consistent item height
              columns: 1, // Single column creates vertical list
              gap: 12, // 12px spacing between items
              itemHeight: 120, // Fixed height for each item
            }}
            // Animation configuration: Smooth enter/exit transitions
            animations={{
              enter: {
                keyframes: {
                  from: {
                    opacity: 0,
                    transform: 'translateX(-20px) scale(0.95)',
                  },
                  to: { opacity: 1, transform: 'translateX(0px) scale(1)' },
                },
                timing: {
                  duration: 250,
                  delay: 0,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                },
                stagger: 30, // 30ms delay between each item animation
              },
              exit: {
                keyframes: {
                  from: { opacity: 1, transform: 'translateX(0px) scale(1)' },
                  to: { opacity: 0, transform: 'translateX(20px) scale(0.8)' },
                },
                timing: {
                  duration: 200,
                  delay: 0,
                  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                },
                stagger: 15, // Faster exit stagger for snappy removal
              },
            }}
            // Drag and drop configuration
            draggable={true} // Enable dragging of items
            droppable={true} // Allow dropping items into this list
            itemType="mock-item" // Type identifier for drag/drop compatibility
            accepts={['mock-item']} // Accept drops of the same type
            getDragMetadata={(item) => ({ item: item as MockItem })} // Data passed during drag
            onDrop={(metadata) => console.log('Dropped within list:', metadata)} // Internal drop handler
            // Accessibility
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
              marginBottom: '8px',
            }}
          >
            Clear Drop Target
          </button>
          <button
            onClick={() => {
              // Restore all items back to source
              setSourceItems(mockItems.slice(0, 50));
              setDroppedItems([]);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reset All Items
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drag and drop with item removal and motion animations. Items are removed from the source list when successfully dropped into the target area. Use "Reset All Items" to restore the original state.',
      },
    },
  },
};

export const WithSelection: Story = {
  render: () => {
    // Selection state management
    // Using Set<string> for O(1) lookup performance with large datasets
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const totalItems = mockItems.slice(0, 200);

    // Select/Deselect all items handler
    // Toggles between selecting all items and clearing selection
    const handleSelectAll = () => {
      if (selectedIds.size === totalItems.length) {
        setSelectedIds(new Set()); // Clear all if all selected
      } else {
        setSelectedIds(new Set(totalItems.map((item) => item.id))); // Select all
      }
    };

    // Bulk action handlers - demonstrate how to work with selected items
    // In real applications, these would perform actual operations
    const handleBulkDelete = () => {
      if (selectedIds.size > 0) {
        alert(`Would delete ${selectedIds.size} selected items:
${Array.from(selectedIds).join(', ')}`);
        // Real implementation would:
        // 1. Show confirmation dialog
        // 2. Make API calls to delete items
        // 3. Update local state/cache
        // 4. Show success/error feedback
      }
    };

    const handleBulkExport = () => {
      if (selectedIds.size > 0) {
        const selectedItems = totalItems.filter((item) =>
          selectedIds.has(item.id),
        );
        alert(`Would export ${selectedIds.size} selected items:
${selectedItems.map((item) => item.name).join(', ')}`);
        // Real implementation would:
        // 1. Prepare export data
        // 2. Generate file (CSV, JSON, etc.)
        // 3. Trigger download
        // 4. Show progress indicator
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            backgroundColor: selectedIds.size > 0 ? '#f8f9fa' : 'transparent',
            transition: 'background-color 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: selectedIds.size > 0 ? '12px' : '0',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                Interactive Selection Demo
              </h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Click items to select/deselect them. Use Ctrl+A to select all.
                <br />
                <strong>Selected:</strong> {selectedIds.size} of{' '}
                {totalItems.length} items
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  backgroundColor:
                    selectedIds.size === totalItems.length
                      ? '#6c757d'
                      : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {selectedIds.size === totalItems.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedIds.size === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedIds.size > 0 ? '#f44336' : '#e9ecef',
                  color: selectedIds.size > 0 ? 'white' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                border: '1px solid #bbdefb',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1976d2',
                }}
              >
                Bulk Actions:
              </span>

              <button
                onClick={handleBulkExport}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                📤 Export ({selectedIds.size})
              </button>

              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                🗑️ Delete ({selectedIds.size})
              </button>

              <div
                style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: '#1976d2',
                }}
              >
                💡 Tip: Click items to toggle selection, use buttons above for
                bulk operations
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <VirtualList
            // Core configuration
            items={totalItems}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <SelectableItemComponent
                item={item as MockItem}
                style={style}
                isSelected={selectedIds.has((item as MockItem).id)}
              />
            )}
            // Layout: 4-column grid for better selection visualization
            layout={{
              mode: 'columns', // Columns mode for consistent grid
              columns: 4, // 4 items per row
              gap: 12, // Spacing between items
              itemHeight: 120, // Fixed item height
            }}
            // Selection configuration
            multiSelect={true} // Enable multi-selection mode
            selectedItems={selectedIds} // Controlled selection state
            onItemSelect={(items) => {
              // Selection change handler - convert items back to Set of IDs
              setSelectedIds(new Set(items.map((item) => (item as MockItem).id)));
            }}
            // Accessibility
            ariaLabel="Selectable virtual list with bulk actions"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enhanced selection with bulk actions UI, keyboard shortcuts (Ctrl+Click, Shift+Click), and visual feedback. Includes select all/clear functionality and interactive bulk operations like export and delete.',
      },
    },
  },
};

export const WithDefaultAnimations: Story = {
  render: () => {
    // State for triggering animations
    // Changing the items array triggers enter animations for new items
    const [items, setItems] = useState<MockItem[]>(mockItems.slice(0, 50));

    // Animation trigger functions
    const refreshItems = () => {
      const newItems = Array.from({ length: 50 }, (_, i) => ({
        id: `refresh-${Date.now()}-${i}`, // Unique IDs ensure React treats as new items
        name: `New Item ${i + 1}`,
      }));
      setItems(newItems); // Triggers enter animations
    };

    const addItems = () => {
      const newItems = Array.from({ length: 10 }, (_, i) => ({
        id: `add-${Date.now()}-${i}`,
        name: `Added Item ${items.length + i + 1}`,
      }));
      setItems((prev) => [...prev, ...newItems]); // Add items to end
    };

    const removeRandomItems = () => {
      const itemsToKeep = Math.max(10, items.length - 15); // Remove up to 15 items
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      setItems(shuffled.slice(0, itemsToKeep)); // Triggers exit animations
    };

    const filterItems = () => {
      // Filter items containing "Item" (keeps some, removes others)
      setItems((prev) => prev.filter((item, index) => index % 3 !== 0));
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
            flexDirection: 'column',
            gap: '12px',
            padding: '0 8px',
          }}
        >
          <h3 style={{ margin: '0' }}>Interactive Animation Triggers</h3>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={refreshItems}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #007acc',
                backgroundColor: '#007acc',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🔄 Refresh All ({items.length} → 50)
            </button>

            <button
              onClick={addItems}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #28a745',
                backgroundColor: '#28a745',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ➕ Add 10 Items
            </button>

            <button
              onClick={removeRandomItems}
              disabled={items.length <= 10}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #dc3545',
                backgroundColor: items.length > 10 ? '#dc3545' : '#e9ecef',
                color: items.length > 10 ? 'white' : '#6c757d',
                cursor: items.length > 10 ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
            >
              🗑️ Remove Random
            </button>

            <button
              onClick={filterItems}
              disabled={items.length === 0}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ffc107',
                backgroundColor: items.length > 0 ? '#ffc107' : '#e9ecef',
                color: items.length > 0 ? 'black' : '#6c757d',
                cursor: items.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
            >
              🔍 Filter Items
            </button>

            <span
              style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}
            >
              Current: <strong>{items.length}</strong> items
            </span>
          </div>
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
            // Core configuration
            items={items}
            keyExtractor={(item) => (item as MockItem).id}
            renderItem={({ item, style }) => (
              <ItemComponent item={item as MockItem} style={style} />
            )}
            // Grid layout for better animation showcase
            layout={{
              mode: 'grid', // Grid mode for 2D layout
              itemSize: { width: 180, height: 120 }, // Fixed item dimensions
              gap: 12, // Spacing between items
            }}
            // Default animation configuration
            // These are the built-in animations that provide smooth enter/exit transitions
            animations={{
              enter: {
                keyframes: {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px) scale(0.95)',
                  },
                  to: { opacity: 1, transform: 'translateY(0px) scale(1)' },
                },
                timing: {
                  duration: 300, // 300ms animation duration
                  delay: 0, // No initial delay
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth easing curve
                },
                stagger: 50, // 50ms delay between each item
              },
              exit: {
                keyframes: {
                  from: { opacity: 1, transform: 'translateY(0px) scale(1)' },
                  to: {
                    opacity: 0,
                    transform: 'translateY(-10px) scale(0.95)',
                  },
                },
                timing: {
                  duration: 200, // Faster exit (200ms)
                  delay: 0,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                },
                stagger: 25, // Faster exit stagger
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
          'Interactive animation showcase with multiple triggers. Demonstrates enter/exit animations with staggering effects. Use the buttons to: refresh all items (enter), add new items (enter), remove items (exit), or filter items (mixed enter/exit).',
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
        story: 'Demonstrates custom animations with slide and rotate effects.',
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
          This example shows the list without animations for maximum
          performance.
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
              <strong>Keyboard Navigation:</strong> Tab to focus list, arrow
              keys (↑↓←→) to navigate items, Home/End to jump to first/last
              item, Enter/Space to select items
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
