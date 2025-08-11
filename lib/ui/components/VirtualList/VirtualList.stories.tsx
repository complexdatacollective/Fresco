import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useMemo, useState } from 'react';
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
    name: faker.person.firstName(),
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

const Node = (
  item: SampleItem,
  _index: number,
  isSelected: boolean,
) => {
  const classes = cn(
    'flex items-center h-full w-full justify-center rounded-full',
    'bg-linear-145 from-50% to-50%',
    'from-[var(--node-color-seq-1)] to-[var(--node-color-seq-1-dark)]',
    'text-white text-sm font-medium',
    'transition-all duration-200',
    isSelected && 'ring ring-white ring-offset-2',
  );

  return (
    <div className={classes}>
      <span className="truncate px-2">{item.name}</span>
    </div>
  );
};

// Simple reusable item renderer for basic rectangular items
const SimpleItemRenderer = (
  item: SampleItem,
  _index: number,
  isSelected: boolean,
) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-lg text-sm text-white transition-all',
        isSelected ? 'bg-primary' : 'bg-accent',
      )}
    >
      {item.name}
    </div>
  );
};

const DataCard = (
  item: SampleItem,
  _index: number,
  isSelected: boolean,
) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg',
        'text-navy-taupe',
        isSelected && 'ring-primary ring-2 ring-offset-2',
      )}
    >
      {/* Label section - constrained height */}
      <div className="flex items-center bg-white px-4 py-2">
        <h2 className="m-0 truncate text-sm font-bold">{item.name}</h2>
      </div>

      {/* Data section - fills remaining space */}
      <div className="bg-accent table w-full flex-1 overflow-hidden px-2 py-1">
        <div className="table-row">
          <div className="table-cell w-1/3 py-1 pr-2 text-right text-xs font-semibold tracking-wider text-white uppercase opacity-50">
            First Name
          </div>
          <div className="table-cell w-full truncate py-1 pl-0 text-xs text-white">
            {item.name}
          </div>
        </div>
        <div className="table-row">
          <div className="table-cell w-1/3 py-1 pr-2 text-right text-xs font-semibold tracking-wider text-white uppercase opacity-50">
            Item ID
          </div>
          <div className="table-cell w-full truncate py-1 pl-0 text-xs text-white">
            {item.id}
          </div>
        </div>
      </div>
    </div>
  );
};

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
) => (
  <DraggableItem item={item} isSelected={isSelected} />
);

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
const ItemRenderer = (item: Item, index: number, isSelected: boolean, isFocused: boolean) => (
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
    const items = useMemo(() => generateItems(200), []);

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
    const items = useMemo(() => generateItems(50), []);

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
          itemRenderer={SimpleItemRenderer}
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

  // Render function with selection and focus styling
  const ItemRenderer = (item: Item, index: number, isSelected: boolean, isFocused: boolean) => (
    <div className={\`flex items-center justify-center h-full w-full rounded-lg transition-all \${
      isSelected ? 'bg-primary text-white' : 'bg-accent text-foreground'
    } \${isFocused ? 'ring-2 ring-accent ring-offset-2' : ''}\`}>
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
    const items = useMemo(() => generateItems(100), []);

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

const ItemRenderer = (item, index, isSelected, isFocused) => (
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
    const items = useMemo(() => generateItems(50), []);

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

const ItemRenderer = (item, index, isSelected, isFocused) => (
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
    const items = useMemo(() => generateItems(30), []);

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

const ItemRenderer = (item, index, isSelected, isFocused) => (
  <div className={\`flex items-center justify-center h-full w-full rounded-lg transition-all \${
    isSelected ? 'bg-primary text-white' : 'bg-accent text-foreground'
  } \${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}\`}>
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
    const items = useMemo(() => generateItems(10000), []);

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
const DraggableItem = ({ item, isSelected, isFocused }) => {
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
const DraggableItemRenderer = (item, index, isSelected, isFocused) => (
  <DraggableItem item={item} isSelected={isSelected} isFocused={isFocused} />
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
    const [leftItems, setLeftItems] = useState(
      useMemo(() => generateItems(100), []),
    );
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
    const [items, setItems] = useState(useMemo(() => generateItems(15), []));
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

    // Custom slide animation configuration
    const slideAnimation = {
      exitAnimation: {
        targets: '.item',
        keyframes: { opacity: 0, x: 20, scale: 0.9 },
        options: { duration: 0.3 },
      },
      itemVariants: {
        initial: { opacity: 0, x: -20, scale: 0.9 },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          x: 20,
          scale: 0.9,
        },
      },
    };

    return (
      <div className="p-5">
        <h3 className="mb-5 text-lg font-semibold">Custom Animation Example</h3>

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
          customAnimation={slideAnimation}
        />
      </div>
    );
  },
};

export const CompleteExample: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Complete example**

<VirtualList 
  items={items}
  itemRenderer={Node}
  layout="grid"           // Auto-responsive grid
  itemWidth={100}
  itemHeight={100}
  spacingUnit={12}
/>

// Fixed column layout
<VirtualList 
  items={items}
  itemRenderer={Node}
  layout="column"         // Fixed column layout
  columns={3}             // Number of columns
  itemHeight={100}        // itemWidth ignored in column layout
  spacingUnit={12}
/>

// Horizontal layout
<VirtualList 
  items={items}
  itemRenderer={Node}
  layout="horizontal"     // Single row with scrolling
  itemWidth={100}
  spacingUnit={12}
/>

**Features:**
- **Mode dropdown**: Switch between Grid (auto-responsive), Column (fixed), and Horizontal (scroll) layouts
- **Column Dropdown**: Select specific column count when in Column mode (1-12 columns)
- **Renderer Dropdown**: Choose between Node and DataCard renderers for grid/horizontal modes
- **Re-trigger Animation**: Button to generate new items and trigger animations by changing listId
- **Add/Remove Items**: Buttons to dynamically add/remove items for testing layout behavior
- **Selection**: Click items to toggle selection, with visual feedback

        `,
      },
    },
  },
  render: () => {
    const [mode, setMode] = useState<'grid' | 'column' | 'horizontal'>('grid');
    const [columnCount, setColumnCount] = useState(3);
    const [renderer, setRenderer] = useState<'node' | 'datacard'>('node');
    const [items, setItems] = useState(useMemo(() => generateItems(50), []));
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set(),
    );
    const [animationTrigger, setAnimationTrigger] = useState(0); // counter to trigger animations

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
      const startId = items.length;
      const newItems = Array.from({ length: 5 }, (_, i) => ({
        id: startId + i,
        name: faker.person.firstName(),
      }));
      setItems((prev) => [...prev, ...newItems]);
    };

    const removeItems = () => {
      if (items.length > 5) {
        setItems((prev) => prev.slice(0, -5));
      }
    };

    const retriggerAnimation = () => {
      // Generate new items with different IDs to trigger fresh animations
      const count = Math.floor(Math.random() * 100) + 50;
      setItems(generateItems(count));
      setAnimationTrigger((prev) => prev + 1); // Change listId to trigger animations
    };

    const listId = `listid-${animationTrigger}`;

    return (
      <div className="bg-navy-taupe p-5">
        <h3 className="mb-3 text-lg text-white">
          Virtual List Complete Example
        </h3>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          {/* Mode Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white">Layout:</label>
            <select
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as 'grid' | 'column' | 'horizontal')
              }
              className="border-input bg-background rounded border px-3 py-2 text-sm"
            >
              <option value="grid">Grid (Auto Responsive)</option>
              <option value="column">Column (Fixed)</option>
              <option value="horizontal">Horizontal (Scroll)</option>
            </select>
          </div>

          {/* Column Count Dropdown - only shown in column mode */}
          {mode === 'column' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Columns:</label>
              <select
                value={columnCount}
                onChange={(e) => setColumnCount(parseInt(e.target.value))}
                className="border-input bg-background rounded border px-3 py-2 text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={12}>12</option>
              </select>
            </div>
          )}

          {/* Renderer Selection - only shown for grid/horizontal modes */}
          {mode !== 'column' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">
                Renderer:
              </label>
              <select
                value={renderer}
                onChange={(e) =>
                  setRenderer(e.target.value as 'node' | 'datacard')
                }
                className="border-input bg-background rounded border px-3 py-2 text-sm"
              >
                <option value="node">Node</option>
                <option value="datacard">DataCard</option>
              </select>
            </div>
          )}

          {/* Re-trigger Animation Button */}
          <button
            type="button"
            onClick={retriggerAnimation}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded px-3 py-2 text-sm"
          >
            Re-trigger Animation
          </button>

          {/* Add/Remove Items Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addItems}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1 text-sm"
            >
              Add 5
            </button>
            <button
              type="button"
              onClick={removeItems}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded px-3 py-1 text-sm"
            >
              Remove 5
            </button>
          </div>
        </div>

        {/* Current Configuration Display - compact horizontal layout */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-white">
          <span>
            Mode:{' '}
            <strong>
              {mode === 'grid'
                ? 'Grid'
                : mode === 'horizontal'
                  ? 'Horizontal'
                  : `${columnCount} Col${columnCount > 1 ? 's' : ''}`}
            </strong>
          </span>
          <span>
            Items: <strong>{items.length}</strong>
          </span>
          <span>
            Selected: <strong>{selectedIds.size}</strong>
          </span>
          <span>
            ListId:{' '}
            <code className="text-foreground rounded bg-white px-2 py-1">
              {listId}
            </code>
          </span>
        </div>

        <VirtualList
          items={items}
          itemRenderer={
            mode === 'column'
              ? DataCard
              : renderer === 'datacard'
                ? DataCard
                : Node
          }
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
          layout={mode}
          columns={mode === 'column' ? columnCount : undefined}
          itemWidth={mode !== 'column' && renderer === 'datacard' ? 400 : 100}
          itemHeight={100}
          spacingUnit={12}
          className="bg-cyber-grape h-128 rounded-lg p-2"
          ariaLabel={`${mode} layout with ${mode === 'column' ? 'datacard' : renderer} items`}
          listId={listId}
        />
      </div>
    );
  },
};
