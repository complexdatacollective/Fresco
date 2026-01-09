'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { useDragAndDrop, type DragItem, type ReorderEvent } from '../dnd';
import { GridLayout, ListLayout } from '../layout';
import { type ItemRenderState, type Key, type SelectionMode } from '../types';

type Item = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const sampleItems: Item[] = [
  { id: '1', name: 'Apple', description: 'A red fruit', color: 'bg-red-100' },
  {
    id: '2',
    name: 'Banana',
    description: 'A yellow fruit',
    color: 'bg-yellow-100',
  },
  {
    id: '3',
    name: 'Cherry',
    description: 'A small red fruit',
    color: 'bg-pink-100',
  },
  {
    id: '4',
    name: 'Date',
    description: 'A sweet fruit',
    color: 'bg-amber-100',
  },
  {
    id: '5',
    name: 'Elderberry',
    description: 'A dark purple berry',
    color: 'bg-purple-100',
  },
  { id: '6', name: 'Fig', description: 'A soft fruit', color: 'bg-stone-100' },
  {
    id: '7',
    name: 'Grape',
    description: 'A small round fruit',
    color: 'bg-violet-100',
  },
  {
    id: '8',
    name: 'Honeydew',
    description: 'A green melon',
    color: 'bg-green-100',
  },
];

type StoryArgs = {
  layoutMode: 'list' | 'grid';
  selectionMode: SelectionMode;
  gap: number;
  padding: number;
  columns: number;
  minItemWidth: number;
  dragEnabled: boolean;
  disabledKeys: string[];
};

function CollectionDemo({
  layoutMode,
  selectionMode,
  gap,
  padding,
  columns,
  minItemWidth,
  dragEnabled,
  disabledKeys,
}: StoryArgs) {
  const [items, setItems] = useState(sampleItems);
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());

  const layout = useMemo(() => {
    if (layoutMode === 'grid') {
      return new GridLayout<Item>({
        columns: columns > 0 ? columns : 'auto',
        gap,
        minItemWidth,
      });
    }
    return new ListLayout<Item>({ gap, padding });
  }, [layoutMode, gap, padding, columns, minItemWidth]);

  const handleReorder = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKeys = Array.from(keys);

    setItems((prev) => {
      const newItems = [...prev];
      const draggedItems = draggedKeys
        .map((key) => newItems.find((item) => item.id === key))
        .filter((item): item is Item => item !== undefined);

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
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'item', keys }],
    onReorder: handleReorder,
    allowedDropPositions: ['before', 'after'],
  });

  const disabledKeysSet = useMemo(
    () => (disabledKeys.length > 0 ? disabledKeys : undefined),
    [disabledKeys],
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-current/70">
          {selectionMode !== 'none' && (
            <span>Selected: {selectedKeys.size} items</span>
          )}
          {selectedKeys.size > 0 && (
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-primary ml-4 underline"
            >
              Clear
            </button>
          )}
        </div>
        <div
          className={
            layoutMode === 'list' ? 'w-full max-w-md' : 'w-full max-w-2xl'
          }
        >
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            textValueExtractor={(item) => item.name}
            layout={layout}
            selectionMode={selectionMode}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            disabledKeys={disabledKeysSet}
            dragAndDropHooks={dragEnabled ? dragAndDropHooks : undefined}
            aria-label="Demo collection"
            renderItem={(item, state) => (
              <div
                className={`${item.color} rounded border p-3 transition-all ${
                  state.isSelected ? 'ring-primary border-primary ring-2' : ''
                } ${state.isFocused ? 'ring-primary/50 ring-1' : ''} ${
                  state.isDisabled ? 'opacity-50' : ''
                } ${state.isDragging ? 'opacity-50' : ''}`}
                data-selected={state.isSelected}
                data-focused={state.isFocused}
                data-disabled={state.isDisabled}
                data-dragging={state.isDragging}
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-current/70">
                  {item.description}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'Systems/Collection',
  component: CollectionDemo,
  parameters: {
    docs: {
      description: {
        component: `
The Collection component renders a list of items with support for:
- **Layout**: List (vertical) or Grid layout
- **Selection**: None, single, or multiple selection modes
- **Keyboard Navigation**: Arrow keys, Home/End, type-ahead search
- **Drag and Drop**: Optional reordering with visual drop indicators

## Usage

\`\`\`tsx
import { Collection, ListLayout, GridLayout } from '~/lib/collection';

// List layout
<Collection
  items={data}
  keyExtractor={(item) => item.id}
  layout={new ListLayout({ gap: 8 })}
  selectionMode="multiple"
  renderItem={(item, state) => (
    <div data-selected={state.isSelected}>{item.name}</div>
  )}
/>

// Grid layout
<Collection
  items={data}
  keyExtractor={(item) => item.id}
  layout={new GridLayout({ columns: 3, gap: 16 })}
  renderItem={(item) => <Card>{item.name}</Card>}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    layoutMode: {
      control: 'radio',
      options: ['list', 'grid'],
      description: 'Layout mode for the collection',
      table: { category: 'Layout' },
    },
    gap: {
      control: { type: 'range', min: 0, max: 32, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    padding: {
      control: { type: 'range', min: 0, max: 32, step: 4 },
      description: 'Padding around the list (list mode only)',
      table: { category: 'Layout' },
      if: { arg: 'layoutMode', eq: 'list' },
    },
    columns: {
      control: { type: 'range', min: 0, max: 6, step: 1 },
      description: 'Number of columns (0 = auto, grid mode only)',
      table: { category: 'Layout' },
      if: { arg: 'layoutMode', eq: 'grid' },
    },
    minItemWidth: {
      control: { type: 'range', min: 100, max: 300, step: 20 },
      description: 'Minimum item width in pixels (grid mode only)',
      table: { category: 'Layout' },
      if: { arg: 'layoutMode', eq: 'grid' },
    },
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple'],
      description: 'Selection behavior',
      table: { category: 'Selection' },
    },
    disabledKeys: {
      control: 'check',
      options: ['1', '3', '5', '7'],
      description: 'Disabled item IDs',
      table: { category: 'Selection' },
    },
    dragEnabled: {
      control: 'boolean',
      description: 'Enable drag and drop reordering',
      table: { category: 'Interaction' },
    },
  },
  args: {
    layoutMode: 'list',
    selectionMode: 'multiple',
    gap: 8,
    padding: 0,
    columns: 0,
    minItemWidth: 200,
    dragEnabled: false,
    disabledKeys: [],
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: (args) => <CollectionDemo {...args} />,
};

export const ListLayoutStory: Story = {
  name: 'List Layout',
  args: {
    layoutMode: 'list',
    selectionMode: 'single',
    gap: 8,
    padding: 16,
  },
};

export const GridLayoutStory: Story = {
  name: 'Grid Layout',
  args: {
    layoutMode: 'grid',
    selectionMode: 'multiple',
    gap: 16,
    columns: 3,
  },
};

export const WithSelection: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'multiple',
    gap: 8,
  },
  parameters: {
    docs: {
      description: {
        story: `
Multiple selection mode supports:
- **Click** to select/deselect
- **Shift+Click** to select a range
- **Ctrl/Cmd+A** to select all
- **Escape** to clear selection
        `,
      },
    },
  },
};

export const WithDragAndDrop: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'single',
    gap: 8,
    dragEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Drag and drop allows reordering items:
- Drag items to new positions
- Drop indicators show insertion points
- Works with both single and multi-select
        `,
      },
    },
  },
};

export const WithDisabledItems: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'multiple',
    gap: 8,
    disabledKeys: ['2', '4'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled items cannot be selected or focused. They are visually dimmed.',
      },
    },
  },
};

export const GridWithDrag: Story = {
  args: {
    layoutMode: 'grid',
    selectionMode: 'single',
    gap: 16,
    columns: 3,
    dragEnabled: true,
  },
};

export const KeyboardNavigation: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'single',
    gap: 8,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate up/down |
| Home/End | Jump to first/last item |
| Space/Enter | Select focused item |
| Shift+↑/↓ | Extend selection (multiple mode) |
| Ctrl/Cmd+A | Select all (multiple mode) |
| Escape | Clear selection |
| Type letters | Jump to matching item |
        `,
      },
    },
  },
};

// Items for the drag between collections demo
const fruitsItems: Item[] = [
  { id: 'f1', name: 'Apple', description: 'A red fruit', color: 'bg-red-100' },
  {
    id: 'f2',
    name: 'Banana',
    description: 'A yellow fruit',
    color: 'bg-yellow-100',
  },
  {
    id: 'f3',
    name: 'Cherry',
    description: 'A small red fruit',
    color: 'bg-pink-100',
  },
  {
    id: 'f4',
    name: 'Grape',
    description: 'A small round fruit',
    color: 'bg-violet-100',
  },
];

const vegetablesItems: Item[] = [
  {
    id: 'v1',
    name: 'Carrot',
    description: 'An orange root vegetable',
    color: 'bg-orange-100',
  },
  {
    id: 'v2',
    name: 'Broccoli',
    description: 'A green vegetable',
    color: 'bg-green-100',
  },
  {
    id: 'v3',
    name: 'Pepper',
    description: 'A colorful vegetable',
    color: 'bg-red-100',
  },
  {
    id: 'v4',
    name: 'Spinach',
    description: 'Leafy greens',
    color: 'bg-emerald-100',
  },
];

function DragBetweenCollectionsDemo(args: Partial<StoryArgs>) {
  const [fruits, setFruits] = useState(fruitsItems);
  const [vegetables, setVegetables] = useState(vegetablesItems);

  // Handle reorder within fruits collection or drop from vegetables
  const handleFruitsDrop = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKeys = Array.from(keys);

    // Check if items are from vegetables (cross-collection)
    const fromVegetables = draggedKeys.some((key) =>
      vegetables.some((v) => v.id === key),
    );

    if (fromVegetables) {
      // Move items from vegetables to fruits
      const itemsToMove = draggedKeys
        .map((key) => vegetables.find((v) => v.id === key))
        .filter((item): item is Item => item !== undefined);

      // Remove from vegetables
      setVegetables((prev) =>
        prev.filter((item) => !draggedKeys.includes(item.id)),
      );

      // Add to fruits at target position
      setFruits((prev) => {
        const targetIndex = prev.findIndex((item) => item.id === target.key);
        if (targetIndex === -1) return [...prev, ...itemsToMove];

        const insertIndex =
          target.position === 'before' ? targetIndex : targetIndex + 1;
        const newItems = [...prev];
        newItems.splice(insertIndex, 0, ...itemsToMove);
        return newItems;
      });
    } else {
      // Reorder within fruits
      setFruits((prev) => {
        const draggedItems = draggedKeys
          .map((key) => prev.find((item) => item.id === key))
          .filter((item): item is Item => item !== undefined);

        const remaining = prev.filter((item) => !draggedKeys.includes(item.id));

        const targetIndex = remaining.findIndex(
          (item) => item.id === target.key,
        );
        if (targetIndex === -1) return prev;

        const insertIndex =
          target.position === 'before' ? targetIndex : targetIndex + 1;
        remaining.splice(insertIndex, 0, ...draggedItems);
        return remaining;
      });
    }
  };

  // Handle reorder within vegetables collection or drop from fruits
  const handleVegetablesDrop = (event: ReorderEvent) => {
    const { keys, target } = event;
    const draggedKeys = Array.from(keys);

    // Check if items are from fruits (cross-collection)
    const fromFruits = draggedKeys.some((key) =>
      fruits.some((f) => f.id === key),
    );

    if (fromFruits) {
      // Move items from fruits to vegetables
      const itemsToMove = draggedKeys
        .map((key) => fruits.find((f) => f.id === key))
        .filter((item): item is Item => item !== undefined);

      // Remove from fruits
      setFruits((prev) =>
        prev.filter((item) => !draggedKeys.includes(item.id)),
      );

      // Add to vegetables at target position
      setVegetables((prev) => {
        const targetIndex = prev.findIndex((item) => item.id === target.key);
        if (targetIndex === -1) return [...prev, ...itemsToMove];

        const insertIndex =
          target.position === 'before' ? targetIndex : targetIndex + 1;
        const newItems = [...prev];
        newItems.splice(insertIndex, 0, ...itemsToMove);
        return newItems;
      });
    } else {
      // Reorder within vegetables
      setVegetables((prev) => {
        const draggedItems = draggedKeys
          .map((key) => prev.find((item) => item.id === key))
          .filter((item): item is Item => item !== undefined);

        const remaining = prev.filter((item) => !draggedKeys.includes(item.id));

        const targetIndex = remaining.findIndex(
          (item) => item.id === target.key,
        );
        if (targetIndex === -1) return prev;

        const insertIndex =
          target.position === 'before' ? targetIndex : targetIndex + 1;
        remaining.splice(insertIndex, 0, ...draggedItems);
        return remaining;
      });
    }
  };

  // Both collections use the same drag type so items can be moved between them
  const { dragAndDropHooks: fruitsDndHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'food-item', keys }],
    onReorder: handleFruitsDrop,
    allowedDropPositions: ['before', 'after'],
  });

  const { dragAndDropHooks: vegetablesDndHooks } = useDragAndDrop<Item>({
    getItems: (keys: Set<Key>): DragItem[] => [{ type: 'food-item', keys }],
    onReorder: handleVegetablesDrop,
    allowedDropPositions: ['before', 'after'],
  });

  const renderItem = (item: Item, state: ItemRenderState) => (
    <div
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-all',
        state.isSelected && 'border-selected',
        state.isFocused && 'focus-styles',
        state.isDisabled && 'opacity-50',
        state.isDragging && 'opacity-50',
      )}
    >
      <Heading level="label">{item.name}</Heading>
      <Paragraph>{item.description}</Paragraph>
    </div>
  );

  const listClasses =
    'bg-surface text-surface-contrast rounded border p-4 flex basis-1/2 h-full flex-col grow shrink-0';

  const layout = useMemo(() => {
    return new ListLayout<Item>({ gap: 8, padding: 8 });
  }, []);

  return (
    <div className="flex h-full grow gap-4">
      <div className={listClasses}>
        <Heading level="h4">Fruits ({fruits.length})</Heading>
        <Collection
          layout={layout}
          items={fruits}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          selectionMode="single"
          dragAndDropHooks={fruitsDndHooks}
          aria-label="Fruits collection"
          renderItem={renderItem}
          emptyState={
            <div className="flex items-center justify-center text-sm text-current/70">
              No fruits available. Drop items here.
            </div>
          }
        />
      </div>
      <div className={listClasses}>
        <Heading level="h4">Vegetables ({vegetables.length})</Heading>
        <Collection
          layout={layout}
          items={vegetables}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          selectionMode="single"
          dragAndDropHooks={vegetablesDndHooks}
          aria-label="Vegetables collection"
          renderItem={renderItem}
          emptyState={
            <div className="flex items-center justify-center text-sm text-current/70">
              No vegetables available. Drop items here.
            </div>
          }
        />
      </div>
    </div>
  );
}

export const DragBetweenCollections: Story = {
  render: () => <DragBetweenCollectionsDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates dragging items between two grid collections:
- **Cross-collection transfer**: Drag items from Fruits to Vegetables and vice versa
- **Reordering**: Items can also be reordered within their own collection
- **Shared drag type**: Both collections accept the same drag type (\`food-item\`)

This pattern is useful for kanban boards, category management, and other multi-list interfaces.
        `,
      },
    },
  },
};
