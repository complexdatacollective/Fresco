'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState, type ReactNode } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Node from '~/lib/ui/components/Node';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { useDragAndDrop, type DragItem, type ReorderEvent } from '../dnd';
import { GridLayout, InlineGridLayout, ListLayout } from '../layout';
import { type ItemProps, type Key, type SelectionMode } from '../types';

type NodeColor =
  | 'node-color-seq-1'
  | 'node-color-seq-2'
  | 'node-color-seq-3'
  | 'node-color-seq-4'
  | 'node-color-seq-5'
  | 'node-color-seq-6'
  | 'node-color-seq-7'
  | 'node-color-seq-8';

type Item = {
  id: string;
  name: string;
  description: string;
  color: NodeColor;
};

const sampleItems: Item[] = [
  {
    id: '1',
    name: 'Apple',
    description: 'A red fruit',
    color: 'node-color-seq-1',
  },
  {
    id: '2',
    name: 'Banana',
    description: 'A yellow fruit',
    color: 'node-color-seq-2',
  },
  {
    id: '3',
    name: 'Cherry',
    description: 'A small red fruit',
    color: 'node-color-seq-3',
  },
  {
    id: '4',
    name: 'Date',
    description: 'A sweet fruit',
    color: 'node-color-seq-4',
  },
  {
    id: '5',
    name: 'Elderberry',
    description: 'A dark purple berry',
    color: 'node-color-seq-5',
  },
  {
    id: '6',
    name: 'Fig',
    description: 'A soft fruit',
    color: 'node-color-seq-6',
  },
  {
    id: '7',
    name: 'Grape',
    description: 'A small round fruit',
    color: 'node-color-seq-7',
  },
  {
    id: '8',
    name: 'Honeydew',
    description: 'A green melon',
    color: 'node-color-seq-8',
  },
];

type ItemComponentType = 'card' | 'node';

type StoryArgs = {
  layoutMode: 'list' | 'grid' | 'inline-grid';
  selectionMode: SelectionMode;
  gap: number;
  columns: number;
  minItemWidth: number;
  itemWidth: number;
  dragEnabled: boolean;
  disabledKeys: string[];
  itemComponent: ItemComponentType;
};

function CardItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  return (
    <div
      {...itemProps}
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-all',
        'data-dragging:opacity-50 data-dragging:shadow-2xl',
        'data-selected:border-selected',
        'data-focused:focus-styles data-focused:shadow',
        'data-disabled:opacity-50',
      )}
    >
      <Heading level="label">{item.name}</Heading>
      <Paragraph>{item.description}</Paragraph>
    </div>
  );
}

function NodeItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  // Read selection and disabled state from itemProps data attributes
  const isSelected = itemProps['data-selected'] === true;
  const isDisabled = itemProps['data-disabled'] === true;

  // Destructure to exclude event handlers that conflict with motion component types
  const {
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    ...restProps
  } = itemProps;

  // Node uses framer-motion internally, which has strict types that don't match standard HTML event types.
  // We cast the props to work around this type incompatibility.
  const nodeProps = {
    ...restProps,
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
  } as React.ComponentProps<typeof Node>;

  return (
    <Node
      {...nodeProps}
      label={item.name}
      color={item.color}
      selected={isSelected}
      disabled={isDisabled}
      size="sm"
      className="transition-all data-dragging:opacity-50"
    />
  );
}

function CollectionDemo({
  layoutMode,
  selectionMode,
  gap,
  columns,
  minItemWidth,
  itemWidth,
  dragEnabled,
  disabledKeys,
  itemComponent,
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
    if (layoutMode === 'inline-grid') {
      return new InlineGridLayout<Item>({ itemWidth, gap });
    }
    return new ListLayout<Item>({ gap });
  }, [layoutMode, gap, columns, minItemWidth, itemWidth]);

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

  const renderItem = (item: Item, itemProps: ItemProps): ReactNode => {
    switch (itemComponent) {
      case 'node':
        return <NodeItem item={item} itemProps={itemProps} />;
      case 'card':
      default:
        return <CardItem item={item} itemProps={itemProps} />;
    }
  };

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
            layoutMode === 'list' ? 'w-full max-w-md' : 'w-full max-w-3xl'
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
            renderItem={renderItem}
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
      options: ['list', 'grid', 'inline-grid'],
      description: 'Layout mode for the collection',
      table: { category: 'Layout' },
    },
    gap: {
      control: { type: 'range', min: 0, max: 32, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
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
    itemWidth: {
      control: { type: 'range', min: 80, max: 300, step: 10 },
      description:
        'Expected item width for keyboard navigation (inline-grid only)',
      table: { category: 'Layout' },
      if: { arg: 'layoutMode', eq: 'inline-grid' },
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
    itemComponent: {
      control: 'radio',
      options: ['card', 'node'],
      description: 'Item component to render',
      table: { category: 'Rendering' },
    },
  },
  args: {
    layoutMode: 'list',
    selectionMode: 'multiple',
    gap: 8,
    columns: 0,
    minItemWidth: 200,
    itemWidth: 150,
    dragEnabled: false,
    disabledKeys: [],
    itemComponent: 'card',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: {},
};

export const ListLayoutStory: Story = {
  name: 'List Layout',
  args: {
    layoutMode: 'list',
    selectionMode: 'single',
    gap: 8,
    itemComponent: 'card',
  },
};

export const GridLayoutStory: Story = {
  name: 'Grid Layout',
  args: {
    layoutMode: 'grid',
    selectionMode: 'multiple',
    gap: 16,
    columns: 3,
    itemComponent: 'card',
  },
};

export const WithSelection: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'multiple',
    gap: 8,
    itemComponent: 'card',
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
    itemComponent: 'card',
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
    itemComponent: 'card',
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
    itemComponent: 'card',
  },
};

export const KeyboardNavigation: Story = {
  args: {
    layoutMode: 'list',
    selectionMode: 'single',
    gap: 8,
    itemComponent: 'card',
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

export const WithNodeItems: Story = {
  args: {
    layoutMode: 'grid',
    selectionMode: 'single',
    gap: 16,
    columns: 4,
    itemComponent: 'node',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collection using Node components for items, useful for network visualizations.',
      },
    },
  },
};

export const NodeGridWithDrag: Story = {
  args: {
    layoutMode: 'grid',
    selectionMode: 'multiple',
    gap: 16,
    columns: 4,
    dragEnabled: true,
    itemComponent: 'node',
  },
  parameters: {
    docs: {
      description: {
        story: 'Node grid with drag and drop enabled for reordering.',
      },
    },
  },
};

type InlineGridDemoArgs = {
  itemWidth: number;
  gap: number;
  selectionMode: SelectionMode;
  itemComponent: ItemComponentType;
};

function InlineGridDemo({
  itemWidth,
  gap,
  selectionMode,
  itemComponent,
}: InlineGridDemoArgs) {
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());

  // itemWidth is used as a fallback for keyboard navigation if DOM queries fail
  // Actual item positions are determined from DOM measurements
  const layout = useMemo(() => {
    return new InlineGridLayout<Item>({ itemWidth, gap });
  }, [itemWidth, gap]);

  const renderItem = (item: Item, itemProps: ItemProps): ReactNode => {
    switch (itemComponent) {
      case 'node':
        return <NodeItem item={item} itemProps={itemProps} />;
      case 'card':
      default:
        return <CardItem item={item} itemProps={itemProps} />;
    }
  };

  return (
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
      <div className="w-full max-w-2xl">
        <Collection
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode={selectionMode}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          aria-label="Inline grid collection"
          renderItem={renderItem}
        />
      </div>
    </div>
  );
}

export const InlineGrid: StoryObj<InlineGridDemoArgs> = {
  render: (args) => <InlineGridDemo {...args} />,
  args: {
    itemWidth: 150,
    gap: 16,
    selectionMode: 'single',
    itemComponent: 'card',
  },
  argTypes: {
    itemWidth: {
      control: { type: 'range', min: 80, max: 300, step: 10 },
      description: 'Fixed width of each item in pixels',
      table: { category: 'Layout' },
    },
    gap: {
      control: { type: 'range', min: 0, max: 32, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    selectionMode: {
      control: 'radio',
      options: ['none', 'single', 'multiple'],
      description: 'Selection behavior',
      table: { category: 'Selection' },
    },
    itemComponent: {
      control: 'radio',
      options: ['card', 'node'],
      description: 'Item component to render',
      table: { category: 'Rendering' },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
InlineGridLayout uses flexbox with flex-wrap for a responsive grid.
Items have a fixed width and wrap to the next row when they exceed the container width.

Key features:
- **Fixed item width**: Each item has a consistent width
- **2D keyboard navigation**: Arrow keys navigate in a grid pattern (up/down moves rows, left/right moves within row)
- **Responsive**: Items automatically wrap based on container width

\`\`\`tsx
<Collection
  layout={new InlineGridLayout({ itemWidth: 150, gap: 16 })}
  items={...}
/>
\`\`\`
        `,
      },
    },
  },
};

function AnimationDemo() {
  const [key, setKey] = useState(0);

  const layout = useMemo(() => {
    return new GridLayout<Item>({
      columns: 3,
      gap: 16,
      minItemWidth: 200,
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setKey((k) => k + 1)}
        className="bg-primary text-primary-contrast w-fit rounded px-4 py-2"
      >
        Replay Animation
      </button>
      <div className="w-full max-w-2xl">
        <Collection
          key={key}
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="single"
          aria-label="Animated collection"
          animate
          renderItem={(item, itemProps) => (
            <CardItem item={item} itemProps={itemProps} />
          )}
        />
      </div>
    </div>
  );
}

export const WithAnimation: Story = {
  render: () => <AnimationDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the stagger enter animation. Items fade in and slide up sequentially when the collection mounts.

\`\`\`tsx
<Collection
  animate
  items={...}
  // ...
/>
\`\`\`
        `,
      },
    },
  },
};

// Items for the drag between collections demo
const fruitsItems: Item[] = [
  {
    id: 'f1',
    name: 'Apple',
    description: 'A red fruit',
    color: 'node-color-seq-1',
  },
  {
    id: 'f2',
    name: 'Banana',
    description: 'A yellow fruit',
    color: 'node-color-seq-2',
  },
  {
    id: 'f3',
    name: 'Cherry',
    description: 'A small red fruit',
    color: 'node-color-seq-3',
  },
  {
    id: 'f4',
    name: 'Grape',
    description: 'A small round fruit',
    color: 'node-color-seq-4',
  },
];

const vegetablesItems: Item[] = [
  {
    id: 'v1',
    name: 'Carrot',
    description: 'An orange root vegetable',
    color: 'node-color-seq-5',
  },
  {
    id: 'v2',
    name: 'Broccoli',
    description: 'A green vegetable',
    color: 'node-color-seq-6',
  },
  {
    id: 'v3',
    name: 'Pepper',
    description: 'A colorful vegetable',
    color: 'node-color-seq-7',
  },
  {
    id: 'v4',
    name: 'Spinach',
    description: 'Leafy greens',
    color: 'node-color-seq-8',
  },
];

type DragBetweenArgs = {
  itemComponent: ItemComponentType;
  gap: number;
};

function DragBetweenCollectionsDemo({ itemComponent, gap }: DragBetweenArgs) {
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

  const renderItem = (item: Item, itemProps: ItemProps): ReactNode => {
    switch (itemComponent) {
      case 'node':
        return <NodeItem item={item} itemProps={itemProps} />;
      case 'card':
      default:
        return <CardItem item={item} itemProps={itemProps} />;
    }
  };

  const listClasses =
    'bg-surface text-surface-contrast rounded border p-4 flex basis-1/2 h-full flex-col grow shrink-0';

  const layout = useMemo(() => {
    return new ListLayout<Item>({ gap });
  }, [gap]);

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

export const DragBetweenCollections: StoryObj<DragBetweenArgs> = {
  render: (args) => <DragBetweenCollectionsDemo {...args} />,
  args: {
    itemComponent: 'card',
    gap: 8,
  },
  argTypes: {
    itemComponent: {
      control: 'radio',
      options: ['card', 'node'],
      description: 'Item component to render',
      table: { category: 'Rendering' },
    },
    gap: {
      control: { type: 'range', min: 0, max: 32, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates dragging items between two collections:
- **Cross-collection transfer**: Drag items from Fruits to Vegetables and vice versa
- **Reordering**: Items can also be reordered within their own collection
- **Shared drag type**: Both collections accept the same drag type (\`food-item\`)

This pattern is useful for kanban boards, category management, and other multi-list interfaces.
        `,
      },
    },
  },
};
