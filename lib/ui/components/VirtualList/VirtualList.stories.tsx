import type { Meta, StoryObj } from '@storybook/nextjs';
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

- **Grid Layout**: Responsive columns based on container width and itemWidth
- **Column Layout**: Fixed columns, items span 100% of column width (itemWidth ignored)
- **Horizontal Layout**: Single row with horizontal scrolling
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
  itemWidth={150}   // Custom width
  itemHeight={80}   // Custom height
  spacingUnit={10}            // Space between items
  className="h-96 border rounded-lg p-2"
/>
\`\`\`

**Key Points:**
- No \`onItemClick\` = read-only, no pointer cursor
- \`itemRenderer\` defines how each item looks
- \`itemWidth\`/\`itemHeight\` control item dimensions (itemWidth ignored in column layout)
- \`layout="grid"\` creates responsive grid, \`layout="column"\` spans 100% of column width

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
          spacingUnit={10}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Basic grid of items"
          listId="basic-list"
        />
      </div>
    );
  },
};

import { fn } from 'storybook/test';

export const ActionOnClick: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Action on Click - Non-Selection Interaction**

This example demonstrates using the \`onItemClick\` prop to handle item clicks without managing selection state.

- Click any item to log an action
- No selection state
- Keyboard navigation: Tab, Arrows, Enter/Space
        `,
      },
    },
  },
  args: {
    onItemClick: fn(),
  },
  render: (args) => {
    const items = generateItems(50).map((item) => ({ ...item }));

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
          Action on Click (50 items)
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Click any item to log the click using Storybook Actions.
        </p>
        <VirtualList
          items={items}
          itemRenderer={AlertItemRenderer}
          onItemClick={args.onItemClick}
          layout="grid"
          itemWidth={120}
          itemHeight={120}
          spacingUnit={12}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Clickable items that show actions"
          listId="action-on-click-list"
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
      spacingUnit={12}
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
        <div className="bg-muted mb-4 rounded-lg p-3">
          <p className="text-sm font-medium">
            Selected: {selectedIds.size} items
          </p>
          {selectedIds.size > 0 ? (
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          ) : (
            <p className="text-xs">
              Click items to select them or use keyboard navigation.
            </p>
          )}
        </div>
        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="grid"
          itemWidth={150}
          itemHeight={100}
          spacingUnit={12}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="Selectable grid items"
          listId="selectable-grid-list"
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
  itemHeight={80}       // Height of each item (width spans 100% of column)
  spacingUnit={16}      // spacing between items and columns
  className="h-96 border rounded-lg p-2"
  // Note: itemWidth is ignored in column layout - items automatically span column width
/>
\`\`\`

**Key Points:**
- \`layout="column"\` creates fixed column layout
- \`columns\` prop is required (number of columns)
- Use \`itemHeight\` for height (width spans 100% of column automatically)
- \`itemWidth\` prop is ignored in column layout
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

        <div className="bg-muted mb-4 rounded-lg p-3">
          <p className="text-sm font-medium">
            Selected: {selectedIds.size} items
          </p>
          {selectedIds.size > 0 ? (
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          ) : (
            <p className="text-xs">
              Click items to select them or use keyboard navigation.
            </p>
          )}
        </div>

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="column"
          columns={columns}
          itemHeight={80}
          spacingUnit={16}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="h-64 w-full rounded-lg bg-white p-2"
          ariaLabel={`Column layout with ${columns} columns`}
          listId="column-layout-list"
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

        <div className="bg-muted mb-4 rounded-lg p-3">
          <p className="text-sm font-medium">
            Selected: {selectedIds.size} items
          </p>
          {selectedIds.size > 0 ? (
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 10).join(', ')}
              {selectedIds.size > 10 &&
                ` ... and ${selectedIds.size - 10} more`}
            </p>
          ) : (
            <p className="text-xs">
              Click items to select them or use keyboard navigation.
            </p>
          )}
        </div>

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="horizontal"
          itemWidth={150}
          spacingUnit={12}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="rounded-lg border bg-white p-2"
          ariaLabel="Horizontal scrolling list"
          listId="horizontal-layout-list"
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

        <div className="bg-muted mb-4 rounded-lg p-3">
          <p className="text-sm font-medium">
            Selected: {selectedIds.size} items (
            {((selectedIds.size / items.length) * 100).toFixed(1)}%)
          </p>
          {selectedIds.size > 0 ? (
            <p className="text-xs">
              Items: {Array.from(selectedIds).slice(0, 15).join(', ')}
              {selectedIds.size > 15 &&
                ` ... and ${selectedIds.size - 15} more`}
            </p>
          ) : (
            <p className="text-xs">
              Click items to select them or use keyboard navigation.
            </p>
          )}
        </div>
        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          layout="grid"
          spacingUnit={8}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          className="rounded-lg border bg-white p-2"
          ariaLabel="Large dataset with 10,000 selectable items"
          listId="large-dataset-list"
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
              itemWidth={80}
              itemHeight={80}
              spacingUnit={8}
              className="h-64"
              focusable={false}
              ariaLabel={`${title} draggable items`}
              listId={`dnd-list-${title.toLowerCase()}`}
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

export const AnimationsStaggered: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Default Staggered Animation**

The VirtualList component supports configurable enter/exit animations using motion/react. By default, it uses a staggered animation pattern inspired by the NodeList component.

\`\`\`typescript
import { VirtualList } from './VirtualList';

// Default staggered animation (default behavior)
<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  animations="staggered"    // Default: staggered entrance with delay
  staggerDelay={0.02}       // Default: 20ms delay between items
  layout="grid"
  itemSize={100}
/>

// Disable animations completely
<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  animations="none"         // No animations
  layout="grid"
  itemSize={100}
/>
\`\`\`

**How Staggered Animation Works:**
- Items animate in with a cascading effect
- Each item starts with \`opacity: 0, y: 10, scale: 0.95\`
- Items animate to \`opacity: 1, y: 0, scale: 1\`
- Each subsequent item has a 20ms delay (configurable with \`staggerDelay\`)
- Exit animations reverse the effect for smooth removal

**Animation States:**
- **Initial**: Items start slightly down and scaled down
- **Animate**: Items move up to position and scale to full size
- **Exit**: Items scale down and move up slightly while fading out

**Performance Note:** These animations are optimized for virtualized lists and only animate items that are actually changing (add/remove), not during scrolling.
        `,
      },
    },
  },
  render: () => {
    const [items, setItems] = useState(generateItems(20));
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    const addItems = () => {
      const newItems = generateItems(5).map((item) => ({
        ...item,
        id: items.length + item.id,
        name: `New Item ${items.length + item.id + 1}`,
      }));
      setItems((prev) => [...prev, ...newItems]);
    };

    const removeItems = () => {
      if (items.length > 5) {
        setItems((prev) => prev.slice(0, -5));
      }
    };

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">
          Staggered Animation (Default)
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Items animate in with a staggered delay. Click buttons to see
          enter/exit animations.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            onClick={addItems}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-1 text-sm text-white"
          >
            Add 5 Items
          </button>
          <button
            onClick={removeItems}
            className="bg-destructive hover:bg-destructive/90 rounded px-3 py-1 text-sm text-white"
          >
            Remove 5 Items
          </button>
        </div>

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          layout="grid"
          spacingUnit={8}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="List with staggered animations"
          listId="staggered-animation-list"
        />
      </div>
    );
  },
};

export const AnimationsCustom: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Custom Animations & When They Trigger**

You can provide custom animation configurations using motion/react variants:

\`\`\`typescript
import { VirtualList } from './VirtualList';

// Custom height-based slide animation (TanStack Virtual best practice)
const slideAnimation: ItemAnimationConfig = {
  initial: { height: 0, opacity: 0, x: -20 },
  animate: { 
    height: 'auto',
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring',
      stiffness: 150,
      damping: 20
    }
  },
  exit: { 
    height: 0,
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
};

// Use custom animation
<VirtualList 
  items={items}
  itemRenderer={ItemRenderer}
  animations={slideAnimation}  // Pass custom config
  layout="grid"
  itemSize={100}
/>
\`\`\`

**When Do Animations Trigger in Virtual Lists?**

⚠️ **Important**: Virtual lists only animate items when they **enter/exit the data array**, NOT when scrolling in/out of view:

- ✅ **Animate**: Adding new items to the \`items\` array
- ✅ **Animate**: Removing items from the \`items\` array  
- ✅ **Animate**: Filtering/sorting that changes the \`items\` array
- ❌ **Don't animate**: Items scrolling into/out of viewport (would hurt performance)

**Best Use Cases:**
- **Data updates**: New messages, notifications, search results
- **User actions**: Adding/removing items from lists
- **State changes**: Filtering, sorting, or other data transformations

**Performance Note**: Animations only apply to visible items in the virtual window, keeping performance smooth even with large datasets.
        `,
      },
    },
  },
  render: () => {
    const [items, setItems] = useState(generateItems(15));
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );

    const handleItemClick = (id: string | number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    };

    const addItems = () => {
      const newItems = generateItems(3).map((item) => ({
        ...item,
        id: Math.max(...items.map((i) => i.id)) + item.id + 1,
        name: `New Item ${Math.max(...items.map((i) => i.id)) + item.id + 2}`,
      }));
      setItems((prev) => [...prev, ...newItems]);
    };

    const removeItems = () => {
      if (items.length > 3) {
        setItems((prev) => prev.slice(0, -3));
      }
    };

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">Custom Animation Example</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          This shows a custom slide animation. Items slide in from left when
          added, slide out to right when removed.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            onClick={addItems}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-1 text-sm text-white"
          >
            Add 3 Items
          </button>
          <button
            onClick={removeItems}
            className="bg-destructive hover:bg-destructive/90 rounded px-3 py-1 text-sm text-white"
          >
            Remove 3 Items
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            💡 Animation Timing
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Animations only trigger when items are added/removed from the data
            array. Scrolling doesn't trigger animations (for performance).
          </p>
        </div>

        <VirtualList
          items={items}
          itemRenderer={SimpleItemRenderer}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          layout="grid"
          spacingUnit={8}
          className="h-96 rounded-lg border bg-white p-2"
          ariaLabel="List with custom slide animations"
          listId="custom-animation-list"
        />
      </div>
    );
  },
};
