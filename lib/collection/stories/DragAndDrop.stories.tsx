import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState } from 'react';
import { DndStoreProvider } from '~/lib/dnd';
import { Collection } from '../components/Collection';
import { useDragAndDrop, type DragItem, type ReorderEvent } from '../dnd';
import { GridLayout, ListLayout } from '../layout';
import { type Key } from '../types';

type Item = {
  id: string;
  name: string;
  color: string;
};

const initialItems: Item[] = [
  { id: '1', name: 'Apple', color: 'bg-red-500' },
  { id: '2', name: 'Banana', color: 'bg-yellow-500' },
  { id: '3', name: 'Orange', color: 'bg-orange-500' },
  { id: '4', name: 'Grape', color: 'bg-purple-500' },
  { id: '5', name: 'Kiwi', color: 'bg-green-500' },
  { id: '6', name: 'Strawberry', color: 'bg-pink-500' },
];

function BasicReorderableList() {
  const [items, setItems] = useState(initialItems);
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  const handleReorder = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKey = Array.from(keys)[0];
    if (!draggedKey) return;

    setItems((prev) => {
      const newItems = [...prev];
      const draggedIndex = newItems.findIndex((item) => item.id === draggedKey);
      const targetIndex = newItems.findIndex((item) => item.id === target.key);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedItem] = newItems.splice(draggedIndex, 1);
      if (!draggedItem) return prev;

      const insertIndex =
        target.position === 'before' ? targetIndex : targetIndex + 1;
      newItems.splice(insertIndex, 0, draggedItem);

      return newItems;
    });
  };

  const { dragAndDropHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'fruit', keys }],
    onReorder: handleReorder,
    allowedDropPositions: ['before', 'after'],
  });

  return (
    <div className="p-8">
      <h2 className="mb-4 text-xl font-bold">Basic Reorderable List</h2>
      <p className="mb-4 text-sm text-gray-600">
        Drag items to reorder them. Uses before/after drop positions.
      </p>
      <Collection
        items={items}
        keyExtractor={(item) => item.id}
        layout={layout}
        renderItem={(item) => (
          <div
            className={`focusable rounded p-4 ${item.color} text-white transition-opacity data-[dragging]:opacity-50`}
          >
            {item.name}
          </div>
        )}
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        dragAndDropHooks={dragAndDropHooks}
        aria-label="Reorderable fruit list"
      />
    </div>
  );
}

function MultiSelectDrag() {
  const [items, setItems] = useState(initialItems);
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  const handleReorder = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKeys = Array.from(keys);

    setItems((prev) => {
      const newItems = [...prev];
      const draggedItems = draggedKeys
        .map((key) => newItems.find((item) => item.id === key))
        .filter((item): item is Item => item !== undefined);

      // Remove dragged items
      const remaining = newItems.filter(
        (item) => !draggedKeys.includes(item.id),
      );

      const targetIndex = remaining.findIndex((item) => item.id === target.key);
      if (targetIndex === -1) return prev;

      const insertIndex =
        target.position === 'before' ? targetIndex : targetIndex + 1;
      remaining.splice(insertIndex, 0, ...draggedItems);

      return remaining;
    });
  };

  const { dragAndDropHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'fruit', keys }],
    onReorder: handleReorder,
    allowedDropPositions: ['before', 'after'],
  });

  return (
    <div className="p-8">
      <h2 className="mb-4 text-xl font-bold">Multi-Select Drag</h2>
      <p className="mb-4 text-sm text-gray-600">
        Select multiple items (Cmd/Ctrl+Click) and drag them together.
      </p>
      <Collection
        items={items}
        keyExtractor={(item) => item.id}
        layout={layout}
        renderItem={(item) => (
          <div
            className={`focusable rounded p-4 ${item.color} text-white transition-opacity data-[dragging]:opacity-50`}
          >
            {item.name}
          </div>
        )}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        dragAndDropHooks={dragAndDropHooks}
        aria-label="Multi-selectable fruit list with drag and drop"
      />
    </div>
  );
}

function GridReordering() {
  const [items, setItems] = useState(initialItems);
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
  const layout = useMemo(
    () =>
      new GridLayout<Item>({
        columns: 3,
        gap: 16,
      }),
    [],
  );

  const handleReorder = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKey = Array.from(keys)[0];
    if (!draggedKey) return;

    setItems((prev) => {
      const newItems = [...prev];
      const draggedIndex = newItems.findIndex((item) => item.id === draggedKey);
      const targetIndex = newItems.findIndex((item) => item.id === target.key);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedItem] = newItems.splice(draggedIndex, 1);
      if (!draggedItem) return prev;

      const insertIndex =
        target.position === 'before' ? targetIndex : targetIndex + 1;
      newItems.splice(insertIndex, 0, draggedItem);

      return newItems;
    });
  };

  const { dragAndDropHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'fruit', keys }],
    onReorder: handleReorder,
    allowedDropPositions: ['before', 'after'],
  });

  return (
    <div className="p-8">
      <h2 className="mb-4 text-xl font-bold">Grid Reordering</h2>
      <p className="mb-4 text-sm text-gray-600">
        Drag items in a grid layout. Drop indicators show insertion points.
      </p>
      <Collection
        items={items}
        keyExtractor={(item) => item.id}
        layout={layout}
        renderItem={(item) => (
          <div
            className={`focusable flex h-24 items-center justify-center rounded ${item.color} text-white transition-opacity data-[dragging]:opacity-50`}
          >
            {item.name}
          </div>
        )}
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        dragAndDropHooks={dragAndDropHooks}
        aria-label="Reorderable fruit grid"
      />
    </div>
  );
}

function CustomDropIndicator() {
  const [items, setItems] = useState(initialItems);
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  const handleReorder = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKey = Array.from(keys)[0];
    if (!draggedKey) return;

    setItems((prev) => {
      const newItems = [...prev];
      const draggedIndex = newItems.findIndex((item) => item.id === draggedKey);
      const targetIndex = newItems.findIndex((item) => item.id === target.key);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedItem] = newItems.splice(draggedIndex, 1);
      if (!draggedItem) return prev;

      const insertIndex =
        target.position === 'before' ? targetIndex : targetIndex + 1;
      newItems.splice(insertIndex, 0, draggedItem);

      return newItems;
    });
  };

  const { dragAndDropHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'fruit', keys }],
    onReorder: handleReorder,
    allowedDropPositions: ['before', 'after', 'on'],
  });

  // Override the drop indicator with custom styling
  const customHooks = {
    ...dragAndDropHooks,
    renderDropIndicator: (target: { key: Key; position: string }) => (
      <div
        key={`${target.key}-${target.position}`}
        className="pointer-events-none absolute right-0 left-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        style={{
          [target.position === 'before' ? 'top' : 'bottom']: '-2px',
        }}
      />
    ),
  };

  return (
    <div className="p-8">
      <h2 className="mb-4 text-xl font-bold">Custom Drop Indicator</h2>
      <p className="mb-4 text-sm text-gray-600">
        Uses a custom gradient drop indicator instead of the default.
      </p>
      <Collection
        items={items}
        keyExtractor={(item) => item.id}
        layout={layout}
        renderItem={(item) => (
          <div
            className={`focusable rounded p-4 ${item.color} text-white transition-opacity data-[dragging]:opacity-50`}
          >
            {item.name}
          </div>
        )}
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        dragAndDropHooks={customHooks}
        aria-label="Fruit list with custom drop indicator"
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Collection/DragAndDrop',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Collection Drag and Drop

Optional drag and drop integration for Collection components using the hooks injection pattern.

## Features

- ✨ **Optional Integration** - DnD is completely optional, Collection works without it
- 🎯 **Hooks Injection** - DnD logic is external, keeping Collection clean
- 🔄 **Reordering** - Support for before/after/on drop positions
- 🎨 **Drop Indicators** - Visual feedback showing where items will be dropped
- 🎭 **Multi-Select** - Drag multiple selected items at once
- ⌨️ **Keyboard Support** - Full keyboard navigation via lib/dnd system

## Usage

\`\`\`tsx
import { Collection, useDragAndDrop } from '~/lib/collection';
import { DndStoreProvider } from '~/lib/dnd';

function MyComponent() {
  const [items, setItems] = useState(data);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [{ type: 'item', keys }],
    onReorder: (event) => {
      // Handle reorder
    },
  });

  return (
    <DndStoreProvider>
      <Collection
        items={items}
        dragAndDropHooks={dragAndDropHooks}
        // ... other props
      />
    </DndStoreProvider>
  );
}
\`\`\`

## Architecture

The DnD system uses a hooks injection pattern:
1. \`useDragAndDrop\` creates hooks that provide DnD behavior
2. Collection accepts these hooks via \`dragAndDropHooks\` prop
3. Collection calls the hooks to get DnD props for items
4. Items become draggable automatically

This keeps DnD logic separate from Collection core logic.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <DndStoreProvider>
        <Story />
      </DndStoreProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const BasicReorder: Story = {
  name: 'Basic Reorderable List',
  render: () => <BasicReorderableList />,
};

export const MultiSelect: Story = {
  name: 'Multi-Select Drag',
  render: () => <MultiSelectDrag />,
};

export const Grid: Story = {
  name: 'Grid Reordering',
  render: () => <GridReordering />,
};

export const CustomIndicator: Story = {
  name: 'Custom Drop Indicator',
  render: () => <CustomDropIndicator />,
};
