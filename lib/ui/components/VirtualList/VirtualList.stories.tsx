import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  DndStoreProvider,
  useDragSource,
  useDropTarget,
  type DragMetadata,
} from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import { VirtualList } from './VirtualList';

// Sample data type
type SampleItem = {
  id: number;
  name: string;
};

// Generate sample data
const generateItems = (count: number): SampleItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
  }));

const meta: Meta<typeof VirtualList> = {
  title: 'UI/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Efficiently renders large lists using virtualization. Supports grid, column, and horizontal layouts with optional selection.
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          // Allow interactive elements without onClickhandler (we have onItemClick)
          { id: 'click-events-have-key-events', enabled: false },
          // Allow click without keyboard equivalent (we have Enter/Space)
          { id: 'no-static-element-interactions', enabled: false },
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VirtualList>;

// Simple item renderer
const SimpleItemRenderer = (
  item: SampleItem,
  _index: number,
  isSelected: boolean,
) => (
  <div
    className={`flex h-full w-full items-center justify-center rounded-lg text-sm text-white transition-all ${isSelected ? 'bg-primary' : 'text-foreground bg-accent'} `}
  >
    {item.name}
  </div>
);

// Draggable item component wrapper
const DraggableItem = ({
  item,
  isSelected,
}: {
  item: SampleItem;
  isSelected: boolean;
}) => {
  const { dragProps, isDragging } = useDragSource({
    type: 'virtual-list-item',
    metadata: item,
    announcedName: item.name,
  });

  return (
    <div
      {...dragProps}
      className={cn(
        'flex h-full w-full cursor-grab items-center justify-center rounded-lg text-sm text-white transition-all active:cursor-grabbing',
        isSelected
          ? 'bg-primary text-white'
          : 'bg-accent hover:bg-accent/80 text-white',
        isDragging && 'opacity-50',
      )}
    >
      {item.name}
    </div>
  );
};

// Draggable item renderer
const DraggableItemRenderer = (
  item: SampleItem,
  index: number,
  isSelected: boolean,
) => <DraggableItem item={item} isSelected={isSelected} />;

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Basic Usage - Read-only List**

\`\`\`typescript
import { VirtualList } from './VirtualList';

type Item = { id: number; name: string };

const items: Item[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  // ... more items
];

// Define how each item should render
const ItemRenderer = (item: Item, index: number, isSelected: boolean) => (
  <div className="flex items-center justify-center h-full w-full bg-accent text-foreground rounded-lg">
    {item.name}
  </div>
);

// Use the VirtualList
<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  layout="grid"
  itemSize={100}      // Sets both width & height (square items)
  // OR use separate dimensions:
  // itemWidth={150}   // Custom width
  // itemHeight={80}   // Custom height
  gap={10}            // Space between items
  className="h-96 border rounded-lg p-2"
/>
\`\`\`

**Key Points:**
- No \`onItemClick\` = read-only, no pointer cursor
- \`itemRenderer\` defines how each item looks
- \`itemSize\` sets both width/height, OR use \`itemWidth\`/\`itemHeight\` separately
- \`layout="grid"\` creates responsive grid

**Keyboard Navigation & Accessibility:**
- **Tab** - Focus the VirtualList container
- **Arrow Keys** - Navigate between items (Up/Down/Left/Right in grid, Left/Right only in horizontal)
- **Enter/Space** - Trigger \`onItemClick\` (if provided) for focused item
- **Screen Readers** - Items have proper ARIA roles (\`listbox\`, \`option\`)
- **Focus Indicators** - Focused item shows blue ring outline
        `,
      },
    },
  },
  render: () => {
    const items = generateItems(200);

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">Basic Grid (200 items)</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          This list has no click functionality. Clicking items or using keyboard
          navigation will not trigger any actions.
        </p>
        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="grid"
          itemSize={100}
          gap={10}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Basic grid of items"
        />
      </div>
    );
  },
};

export const AlertOnClick: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Alert on Click - Non-Selection Interaction**

\`\`\`typescript
import { VirtualList } from './VirtualList';

type Item = { id: number; name: string; description: string };

function MyComponent() {
  const items: Item[] = [
    { id: 1, name: 'Item 1', description: 'This is the first item' },
    { id: 2, name: 'Item 2', description: 'This is the second item' },
    // ... more items
  ];

  // Handle clicks with custom logic - not selection!
  const handleItemClick = (id: string | number) => {
    const item = items.find(item => item.id === id);
    if (item) {
      alert(\`Clicked: \${item.name}\\n\\n\${item.description}\`);
    }
  };

  // Simple renderer - no selection styling needed
  const ItemRenderer = (item: Item, _index: number, _isSelected: boolean) => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-accent text-foreground transition-all">
      {item.name}
    </div>
  );

  return (
    <VirtualList 
      items={items}
      itemRenderer={ItemRenderer}
      onItemClick={handleItemClick}  // Custom click handler
      // No selectedIds prop = no selection styling
      layout="grid"
      itemSize={120}
      gap={12}
      className="h-96 border rounded-lg p-2"
    />
  );
}
\`\`\`

**Key Points:**
- \`onItemClick\` can do anything - alerts, navigation, modals, etc.
- No \`selectedIds\` prop = no selection highlighting
- \`isSelected\` will always be \`false\` in itemRenderer
- Perfect for action-based interactions vs state-based selection

**Keyboard Navigation:**
- **Tab** - Focus the list, then use arrow keys to navigate
- **Arrow Keys** - Move focus between items
- **Enter/Space** - Trigger the alert for focused item
- **Escape** - Dismiss alert (browser behavior)
        `,
      },
    },
  },
  render: () => {
    const items = generateItems(50).map((item) => ({
      ...item,
    }));

    const handleItemClick = (id: string | number) => {
      const item = items.find((item) => item.id === id);
      if (item) {
        alert(`Clicked: ${item.name}`);
      }
    };

    const AlertItemRenderer = (
      item: (typeof items)[0],
      _index: number,
      _isSelected: boolean,
    ) => (
      <div className="bg-accent flex h-full w-full items-center justify-center rounded-lg text-white">
        {item.name}
      </div>
    );

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">
          Alert on Click (50 items)
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Click any item to see an alert with its details. No selection state
          managed.
        </p>
        <VirtualList
          items={items}
          itemRenderer={AlertItemRenderer}
          onItemClick={handleItemClick}
          layout="grid"
          itemSize={120}
          gap={12}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Clickable items that show alerts"
        />
      </div>
    );
  },
};

export const Grid: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Grid with Selection - Complete Example**

\`\`\`typescript
import { VirtualList } from './VirtualList';
import { useState } from 'react';

type Item = { id: number; name: string };

function MyComponent() {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  
  const items: Item[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    // ... more items
  ];

  // Handle item clicks - toggle selection
  const handleItemClick = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Render function with selection styling
  const ItemRenderer = (item: Item, index: number, isSelected: boolean) => (
    <div className={\`flex items-center justify-center h-full w-full rounded-lg transition-all \${
      isSelected ? 'bg-primary text-white' : 'bg-accent text-foreground'
    }\`}>
      {item.name}
    </div>
  );

  return (
    <VirtualList 
      items={items}
      itemRenderer={ItemRenderer}
      selectedIds={selectedIds}      // Pass current selection
      onItemClick={handleItemClick}  // Handle clicks
      layout="grid"
      itemWidth={150}                // Custom width for rectangular items
      itemHeight={100}               // Custom height
      gap={12}
      className="h-96 border rounded-lg p-2"
    />
  );
}
\`\`\`

**Selection Management:**
\`\`\`typescript
// Get selected items
const selectedItems = items.filter(item => selectedIds.has(item.id));

// Clear selection
setSelectedIds(new Set());

// Select all
setSelectedIds(new Set(items.map(item => item.id)));
\`\`\`

**Keyboard Navigation & Accessibility:**
- **Tab** - Focus the VirtualList container
- **Arrow Keys** - Navigate between items and auto-scroll into view
- **Enter/Space** - Toggle selection for focused item
- **Screen Reader Support** - Announces selections and navigation
- **ARIA Labels** - \`aria-multiselectable="true"\`, \`aria-selected\` states
        `,
      },
    },
  },
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );
    const items = generateItems(100);

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">Grid Layout (100 items)</h3>
        {selectedIds.size > 0 && (
          <div className="bg-muted mb-4 rounded-lg p-3">
            <p className="text-sm font-medium">
              Selected: {selectedIds.size} items
            </p>
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          </div>
        )}
        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="grid"
          itemWidth={150}
          itemHeight={100}
          gap={12}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Selectable grid items"
        />
      </div>
    );
  },
};

export const Column: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Column Layout - Fixed Column Count**

\`\`\`typescript
import { VirtualList } from './VirtualList';

const items = generateItems(100);

const ItemRenderer = (item, index, isSelected) => (
  <div className="flex items-center justify-center h-full w-full bg-accent text-foreground rounded-lg">
    {item.name}
  </div>
);

<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  layout="column"       // Fixed column layout
  columns={3}           // Number of columns (required for column layout)
  itemHeight={80}       // Height of each item (width fills column)
  gap={16}              // Gap between items and columns
  className="h-96 border rounded-lg p-2"
/>
\`\`\`

**Key Points:**
- \`layout="column"\` creates fixed column layout
- \`columns\` prop is required (number of columns)
- Use \`itemHeight\` for height (width fills column automatically)
- Width calculated automatically: \`(100% - gaps) / columns\`

**Keyboard Navigation:**
- **Arrow Keys** - Up/Down navigate within columns, Left/Right navigate between columns
- **Auto-scroll** - Focused items automatically scroll into view
        `,
      },
    },
  },
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );
    const [columns, setColumns] = useState(2);
    const items = generateItems(50);

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    return (
      <div className="h-96 w-full p-5">
        <h3 className="mb-5 text-lg font-semibold">
          Column Layout ({columns} columns, 50 items)
        </h3>

        <div className="mb-4 flex items-center gap-4">
          <label htmlFor="column-select" className="text-sm font-medium">
            Columns:
          </label>
          <select
            id="column-select"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            className="ml-2 rounded border px-2 py-1"
            aria-label="Number of columns"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-muted mb-4 rounded-lg p-3">
            <p className="text-sm font-medium">
              Selected: {selectedIds.size} items
            </p>
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          </div>
        )}

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="column"
          columns={columns}
          itemHeight={80}
          gap={16}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="rounded-lg border bg-white p-2"
          ariaLabel={`Column layout with ${columns} columns`}
        />
      </div>
    );
  },
};

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Horizontal Layout - Scrolling Row**

\`\`\`typescript
import { VirtualList } from './VirtualList';

const items = generateItems(50);

const ItemRenderer = (item, index, isSelected) => (
  <div className="flex items-center justify-center h-full w-full bg-accent text-foreground rounded-lg">
    {item.name}
  </div>
);

<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  layout="horizontal"   // Horizontal scrolling layout
  itemWidth={150}       // Width of each item (height fills container)
  gap={12}              // Space between items
  className="h-32 border rounded-lg p-2"  // Fixed height container
/>
\`\`\`

**Key Points:**
- \`layout="horizontal"\` creates horizontal scrolling
- Use \`itemWidth\` for width (height fills container automatically)
- Container needs fixed height via className

**Keyboard Navigation:**
- **Left/Right Arrows** - Navigate between items and auto-scroll into view
- **Up/Down Arrows** - Disabled (no vertical navigation)
- **Enter/Space** - Trigger \`onItemClick\` for focused item
- **Tab** - Focus the scrollable container
        `,
      },
    },
  },
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );
    const items = generateItems(30);

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    return (
      <div className="h-64 w-full p-5">
        <h3 className="mb-5 text-lg font-semibold">
          Horizontal Layout (30 items)
        </h3>

        {selectedIds.size > 0 && (
          <div className="bg-muted mb-4 rounded-lg p-3">
            <p className="text-sm font-medium">
              Selected: {selectedIds.size} items
            </p>
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          </div>
        )}

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="horizontal"
          itemWidth={150}
          gap={12}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="rounded-lg border bg-white p-2"
          ariaLabel="Horizontal scrolling list"
        />
      </div>
    );
  },
};

export const LargeDataset: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Large Dataset - Performance Demo**

\`\`\`typescript
import { VirtualList } from './VirtualList';

// Generate large dataset
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: \`Item \${i + 1}\`
}));

const ItemRenderer = (item, index, isSelected) => (
  <div className={\`flex items-center justify-center h-full w-full rounded-lg transition-all \${
    isSelected ? 'bg-primary text-white' : 'bg-accent text-foreground'
  }\`}>
    {item.name}
  </div>
);

<VirtualList 
  items={items}                    // 10,000 items!
  itemRenderer={ItemRenderer}
  selectedIds={selectedIds}
  onItemClick={handleItemClick}
  layout="grid"
  itemSize={100}
  gap={8}
  className="h-[600px] border rounded-lg p-2"
/>
\`\`\`

**Performance Notes:**
- Only visible items are rendered (virtualization)
- Smooth scrolling regardless of dataset size
- Memory efficient - DOM nodes reused
- 10k+ items perform like 100 items

**Accessibility with Large Data:**
- **Tab Index Management** - Only container and focused item are tabbable
- **Virtual Focus** - Arrow key navigation works across entire dataset
- **Screen Reader** - Announces position (e.g. "Item 5,432 of 10,000")
- **Auto-scroll** - Focused items automatically scroll into view
        `,
      },
    },
  },
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );
    const items = generateItems(10000);

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    return (
      <div className="h-[600px] w-full p-5">
        <h3 className="mb-5 text-lg font-semibold">
          Large Dataset (10,000 items)
        </h3>

        {selectedIds.size > 0 ? (
          <div className="bg-muted mb-4 rounded-lg p-3">
            <p className="text-sm font-medium">
              Selected: {selectedIds.size} items (
              {((selectedIds.size / items.length) * 100).toFixed(1)}%)
            </p>
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 15).join(', ')}
              {selectedIds.size > 15 &&
                ` ... and ${selectedIds.size - 15} more`}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground mb-4 text-sm">
            No items selected. Click items to select them or use keyboard
            navigation.
          </p>
        )}
        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="grid"
          itemSize={100}
          gap={8}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="rounded-lg border bg-white p-2"
          ariaLabel="Large dataset with 10,000 selectable items"
        />
      </div>
    );
  },
};

export const DragAndDrop: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Drag and Drop - Between Two Lists**

\`\`\`typescript
import { VirtualList } from './VirtualList';
import { DndStoreProvider, useDragSource, useDropTarget } from '~/lib/dnd';

// Draggable item component
const DraggableItem = ({ item, isSelected }) => {
  const { dragProps, isDragging } = useDragSource({
    type: 'virtual-list-item',
    metadata: item,
    announcedName: item.name,
  });

  return (
    <div
      {...dragProps}
      className={\`flex items-center justify-center h-full w-full rounded-lg text-white \${
        isDragging ? 'opacity-50' : ''
      } \${isSelected ? 'bg-primary' : 'bg-accent'}\`}
    >
      {item.name}
    </div>
  );
};

// Item renderer for VirtualList
const DraggableItemRenderer = (item, index, isSelected) => (
  <DraggableItem item={item} isSelected={isSelected} />
);

// Drop zone wrapper around VirtualList
const DropZoneVirtualList = ({ items, onItemReceived, title }) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: \`list-\${title}\`,
    accepts: ['virtual-list-item'],
    onDrop: onItemReceived,
  });

  return (
    <div
      {...dropProps}
      className={\`border-2 border-dashed rounded-lg p-2 \${
        isOver && willAccept ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }\`}
    >
      <VirtualList
        items={items}
        itemRenderer={DraggableItemRenderer}
        layout="grid"
        itemSize={80}
        gap={8}
        className="h-64"
        focusable={false}  // No ARIA listbox roles, prevents nested interactive controls
      />
    </div>
  );
};

// Usage
function DragDropLists() {
  const [leftItems, setLeftItems] = useState(initialItems);
  const [rightItems, setRightItems] = useState([]);

  const moveItem = (item, fromLeft) => {
    if (fromLeft) {
      setLeftItems(prev => prev.filter(i => i.id !== item.id));
      setRightItems(prev => [...prev, item]);
    } else {
      setRightItems(prev => prev.filter(i => i.id !== item.id));
      setLeftItems(prev => [...prev, item]);
    }
  };

  return (
    <DndStoreProvider>
      <div className="grid grid-cols-2 gap-6">
        <DropZoneVirtualList
          items={leftItems}
          onItemReceived={(metadata) => moveItem(metadata, false)}
          title="Left"
        />
        <DropZoneVirtualList
          items={rightItems}
          onItemReceived={(metadata) => moveItem(metadata, true)}
          title="Right"
        />
      </div>
    </DndStoreProvider>
  );
}
\`\`\`

**Key Points:**
- No \`onItemClick\` or \`selectedIds\` = no selection interference
- Wrap items with DnD hooks in custom renderer
- Wrap VirtualList in drop zone for drop targets
- Use DndStoreProvider at root level
- Set \`focusable={false}\` to prevent nested interactive controls

**Keyboard Accessibility for Drag & Drop:**
- **Tab** - Focus draggable items directly (VirtualList container not focusable)
- **Space/Enter** - Start drag operation with keyboard
- **Arrow Keys** - Navigate between drop zones during drag
- **Space/Enter** - Drop item in focused drop zone
- **Escape** - Cancel drag operation
- **Screen Reader** - Announces drag state and valid drop zones
        `,
      },
    },
  },
  render: () => {
    const [leftItems, setLeftItems] = useState(generateItems(100));
    const [rightItems, setRightItems] = useState<SampleItem[]>([]);

    const moveItem = (item: SampleItem, fromLeft: boolean) => {
      if (fromLeft) {
        setLeftItems((prev) => prev.filter((i) => i.id !== item.id));
        setRightItems((prev) => [...prev, item]);
      } else {
        setRightItems((prev) => prev.filter((i) => i.id !== item.id));
        setLeftItems((prev) => [...prev, item]);
      }
    };

    const DropZoneVirtualList = ({
      items,
      onItemReceived,
      title,
    }: {
      items: SampleItem[];
      onItemReceived: (metadata?: DragMetadata) => void;
      title: string;
    }) => {
      const { dropProps, willAccept, isOver, isDragging } = useDropTarget({
        id: `virtual-list-${title.toLowerCase()}`,
        accepts: ['virtual-list-item'],
        announcedName: `${title} list`,
        onDrop: onItemReceived,
      });

      return (
        <div className="flex flex-col">
          <h4 className="mb-2 text-sm font-medium">
            {title} ({items.length} items)
          </h4>

          <div
            {...dropProps}
            className={cn(
              'border-border bg-background rounded-lg border-2 border-dashed p-1 transition-all',
              isDragging && willAccept && 'border-kiwi',
              isOver && 'bg-kiwi/10 border-kiwi',
            )}
          >
            <VirtualList
              items={items}
              itemRenderer={DraggableItemRenderer}
              layout="grid"
              itemSize={80}
              gap={8}
              className="h-64"
              focusable={false}
            />
          </div>
        </div>
      );
    };

    return (
      <DndStoreProvider>
        <div className="p-5">
          <h3 className="mb-5 text-lg font-semibold">
            Drag and Drop Between Lists
          </h3>
          <p className="mb-4 text-sm">
            Drag items between the two lists. Items will be moved from one list
            to the other.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DropZoneVirtualList
              items={leftItems}
              onItemReceived={(metadata) => {
                if (metadata) {
                  moveItem(metadata as SampleItem, false);
                }
              }}
              title="Left List"
            />

            <DropZoneVirtualList
              items={rightItems}
              onItemReceived={(metadata) => {
                if (metadata) {
                  moveItem(metadata as SampleItem, true);
                }
              }}
              title="Right List"
            />
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};
