'use client';

import { faker } from '@faker-js/faker';
import { useCallback, useMemo, useState } from 'react';
import preview from '~/.storybook/preview';
import Node, { type NodeColorSequence } from '~/components/Node';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { CollectionSortButton } from '../components/CollectionSortButton';
import { CollectionSortSelect } from '../components/CollectionSortSelect';
import { useSortManager } from '../contexts';
import { type DropEvent } from '../dnd/types';
import { useDragAndDrop } from '../dnd/useDragAndDrop';
import { GridLayout } from '../layout/GridLayout';
import { InlineGridLayout } from '../layout/InlineGridLayout';
import { type Layout } from '../layout/Layout';
import { ListLayout } from '../layout/ListLayout';
import { type ItemProps, type Key, type SelectionMode } from '../types';

type Item = {
  id: string;
  name: string;
  description: string;
  color: NodeColorSequence;
};

const collectionClasses =
  'w-full flex flex-col gap-8 bg-surface text-surface-contrast publish-colors p-6 rounded';

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

// Item Components
function CardItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  return (
    <div
      {...itemProps}
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-colors',
        'data-dragging:opacity-50 data-dragging:shadow-2xl',
        'data-selected:bg-accent data-selected:text-accent-contrast data-selected:outline-accent',
        'focusable',
        'data-disabled:opacity-50',
      )}
    >
      <Heading level="label">{item.name}</Heading>
      <Paragraph>{item.description}</Paragraph>
    </div>
  );
}

function NodeItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  const isSelected = itemProps['data-selected'] === true;
  const isDisabled = itemProps['data-disabled'] === true;

  const {
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    ...restProps
  } = itemProps;

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
    />
  );
}

// Layout and item component types for controls
type LayoutType = 'list' | 'grid' | 'inlineGrid';
type ItemComponentType = 'card' | 'node';

// Story args type
type CollectionStoryArgs = {
  layoutType: LayoutType;
  itemComponent: ItemComponentType;
  selectionMode: SelectionMode;
  animate: boolean;
  // Layout options
  gap: number;
  // Grid-specific options
  minItemWidth: number;
};

// Helper to create layout from args
function createLayout(args: CollectionStoryArgs): Layout<Item> {
  const { layoutType, gap, minItemWidth } = args;

  switch (layoutType) {
    case 'grid':
      return new GridLayout<Item>({
        gap,
        minItemWidth,
      });
    case 'inlineGrid':
      return new InlineGridLayout<Item>({
        gap,
      });
    case 'list':
    default:
      return new ListLayout<Item>({ gap });
  }
}

// Shared render function for all stories
function CollectionStoryRender(args: CollectionStoryArgs) {
  const { layoutType, itemComponent, selectionMode, animate } = args;

  const layout = useMemo(() => createLayout(args), [args]);

  const renderItem = (item: Item, itemProps: ItemProps) => {
    switch (itemComponent) {
      case 'node':
        return <NodeItem item={item} itemProps={itemProps} />;
      case 'card':
      default:
        return <CardItem item={item} itemProps={itemProps} />;
    }
  };

  return (
    <div className={cx(collectionClasses, 'h-full p-4')}>
      <Heading level="h2">Collection Demo</Heading>
      <Paragraph>
        Layout: <strong>{layoutType}</strong> | Item:{' '}
        <strong>{itemComponent}</strong> | Selection:{' '}
        <strong>{selectionMode}</strong>
      </Paragraph>

      <button className="focusable bg-surface-1 rounded px-3 py-1">
        previous item for testing focus
      </button>
      <Collection
        items={sampleItems}
        layout={layout}
        keyExtractor={(item: Item) => item.id}
        renderItem={renderItem}
        selectionMode={selectionMode}
        animate={animate}
      />
      <button className="focusable bg-surface-1 rounded px-3 py-1">
        next item for testing focus
      </button>
    </div>
  );
}

// Shared argTypes with conditional controls
const collectionArgTypes = {
  layoutType: {
    control: 'select' as const,
    options: ['list', 'grid', 'inlineGrid'],
    description: 'The layout algorithm to use',
    table: { category: 'Layout' },
  },
  gap: {
    control: { type: 'range' as const, min: 0, max: 48, step: 4 },
    description: 'Gap between items in pixels',
    table: { category: 'Layout' },
  },
  minItemWidth: {
    control: { type: 'range' as const, min: 100, max: 400, step: 20 },
    description: 'Minimum item width for Grid layout (columns auto-calculated)',
    table: { category: 'Layout - Grid' },
    if: { arg: 'layoutType', eq: 'grid' },
  },
  itemComponent: {
    control: 'select' as const,
    options: ['card', 'node'],
    description: 'The component to render for each item',
    table: { category: 'Rendering' },
  },
  selectionMode: {
    control: 'select' as const,
    options: ['none', 'single', 'multiple'],
    description: 'Selection behavior',
    table: { category: 'Behavior' },
  },
  animate: {
    control: 'boolean' as const,
    description: 'Enable layout animations',
    table: { category: 'Behavior' },
  },
};

// Shared default args
const defaultArgs: CollectionStoryArgs = {
  layoutType: 'list',
  itemComponent: 'card',
  selectionMode: 'multiple',
  animate: true,
  gap: 12,
  minItemWidth: 200,
};

const meta = preview.meta({
  title: 'Systems/Collection',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: collectionArgTypes,
  args: defaultArgs,
  render: (args) => (
    <CollectionStoryRender {...(args as CollectionStoryArgs)} />
  ),
});

export const Primary = meta.story({});

export const GridLayout_Story = meta.story({
  name: 'Grid Layout',
  args: {
    layoutType: 'grid',
    gap: 16,
  },
});

export const NodeItems = meta.story({
  name: 'Node Items',
  args: {
    layoutType: 'inlineGrid',
    itemComponent: 'node',
    gap: 16,
  },
});

// =========================================
// Drag and Drop Between Collections Story
// =========================================

type Person = {
  id: string;
  name: string;
  color: NodeColorSequence;
};

// Use a fixed seed to ensure consistent names across renders
faker.seed(42);

function generatePeople(count: number, idPrefix: string): Person[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}${i + 1}`,
    name: faker.person.fullName(),
    color: 'node-color-seq-1',
  }));
}

const initialLeftItems: Person[] = generatePeople(15, 'left-');
const initialRightItems: Person[] = generatePeople(12, 'right-');

function PersonNode({
  item,
  itemProps,
}: {
  item: Person;
  itemProps: ItemProps;
}) {
  const isSelected = itemProps['data-selected'] === true;
  const isDisabled = itemProps['data-disabled'] === true;

  const {
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    ...restProps
  } = itemProps;

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
    />
  );
}

function DragDropBetweenCollections() {
  const [leftItems, setLeftItems] = useState<Person[]>(initialLeftItems);
  const [rightItems, setRightItems] = useState<Person[]>(initialRightItems);

  // Shared item type allows dragging between collections
  const ITEM_TYPE = 'person';

  // Handle items dropped onto the left collection
  const handleLeftDrop = useCallback(
    (e: DropEvent) => {
      // Find items being dropped from right collection
      const itemsToMove = rightItems.filter((item) => e.keys.has(item.id));
      if (itemsToMove.length === 0) return;

      // Remove from right, add to left
      setRightItems((prev) => prev.filter((item) => !e.keys.has(item.id)));
      setLeftItems((prev) => [...prev, ...itemsToMove]);
    },
    [rightItems],
  );

  // Handle items dropped onto the right collection
  const handleRightDrop = useCallback(
    (e: DropEvent) => {
      // Find items being dropped from left collection
      const itemsToMove = leftItems.filter((item) => e.keys.has(item.id));
      if (itemsToMove.length === 0) return;

      // Remove from left, add to right
      setLeftItems((prev) => prev.filter((item) => !e.keys.has(item.id)));
      setRightItems((prev) => [...prev, ...itemsToMove]);
    },
    [leftItems],
  );

  const { dragAndDropHooks: leftDndHooks } = useDragAndDrop<Person>({
    getItems: () => [{ type: ITEM_TYPE, keys: new Set<Key>() }],
    onDrop: handleLeftDrop,
  });

  const { dragAndDropHooks: rightDndHooks } = useDragAndDrop<Person>({
    getItems: () => [{ type: ITEM_TYPE, keys: new Set<Key>() }],
    onDrop: handleRightDrop,
  });

  const leftLayout = useMemo(
    () =>
      new InlineGridLayout<Person>({
        gap: 16,
      }),
    [],
  );

  const rightLayout = useMemo(
    () =>
      new InlineGridLayout<Person>({
        gap: 16,
      }),
    [],
  );

  const renderItem = (item: Person, itemProps: ItemProps) => (
    <PersonNode item={item} itemProps={itemProps} />
  );

  // Collection container classes with drop target styling
  const dropZoneClasses = cx(
    'transition-colors',
    // Highlight when a valid drop target (use bracket notation for hyphenated data attributes)
    'data-[drop-target-valid=true]:bg-accent/10 data-[drop-target-over=true]:bg-accent/20! data-[drop-target-over=true]:ring-accent data-[drop-target-over=true]:ring-2',
  );

  return (
    <div className="flex h-full gap-8">
      <div className={cx(collectionClasses, 'flex-1')}>
        <Heading level="h2">Team A ({leftItems.length} people)</Heading>
        <Paragraph>Drag people to move them to the other team.</Paragraph>
        <Collection
          id="team-a-collection"
          className={dropZoneClasses}
          items={leftItems}
          layout={leftLayout}
          keyExtractor={(item: Person) => item.id}
          renderItem={renderItem}
          selectionMode="multiple"
          animate
          dragAndDropHooks={leftDndHooks}
          aria-label="Team A collection"
        />
      </div>

      <div className={cx(collectionClasses, 'flex-1')}>
        <Heading level="h2">Team B ({rightItems.length} people)</Heading>
        <Paragraph>Drag people to move them to the other team.</Paragraph>
        <Collection
          id="team-b-collection"
          className={dropZoneClasses}
          items={rightItems}
          layout={rightLayout}
          keyExtractor={(item: Person) => item.id}
          renderItem={renderItem}
          selectionMode="multiple"
          animate
          dragAndDropHooks={rightDndHooks}
          aria-label="Team B collection"
        />
      </div>
    </div>
  );
}

export const DragDropBetweenCollectionsStory = meta.story({
  name: 'Drag Drop Between Collections',
  render: () => <DragDropBetweenCollections />,
});

// =========================================
// Dynamic Items Story (Layout Animations)
// =========================================

function DynamicItemsDemo() {
  const [items, setItems] = useState<Item[]>(sampleItems.slice(0, 4));
  const [nextId, setNextId] = useState(100);

  const addItem = useCallback(() => {
    const colors: NodeColorSequence[] = [
      'node-color-seq-1',
      'node-color-seq-2',
      'node-color-seq-3',
      'node-color-seq-4',
      'node-color-seq-5',
      'node-color-seq-6',
      'node-color-seq-7',
      'node-color-seq-8',
    ];
    const newItem: Item = {
      id: `item-${nextId}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription().slice(0, 50),
      color: colors[nextId % colors.length]!,
    };
    setItems((prev) => [...prev, newItem]);
    setNextId((prev) => prev + 1);
  }, [nextId]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const shuffleItems = useCallback(() => {
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  const layout = useMemo(
    () =>
      new InlineGridLayout<Item>({
        gap: 16,
      }),
    [],
  );

  const renderItem = (item: Item, itemProps: ItemProps) => {
    const isSelected = itemProps['data-selected'] === true;
    const isDisabled = itemProps['data-disabled'] === true;

    const {
      ref,
      onFocus,
      onClick,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      ...restProps
    } = itemProps;

    const nodeProps = {
      ...restProps,
      ref,
      onFocus,
      onClick: (e: React.MouseEvent) => {
        // Remove on click unless shift is held (for selection)
        if (!e.shiftKey) {
          removeItem(item.id);
        } else {
          onClick?.(e as React.MouseEvent<HTMLElement>);
        }
      },
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
      />
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex gap-4">
        <button
          onClick={addItem}
          className="focusable bg-surface-1 rounded px-4 py-2"
        >
          Add Item
        </button>
        <button
          onClick={shuffleItems}
          className="focusable bg-surface-1 rounded px-4 py-2"
        >
          Shuffle Items
        </button>
        <span className="text-surface-contrast/60 self-center">
          Click an item to remove it
        </span>
      </div>

      <div className={cx(collectionClasses, 'flex-1 overflow-hidden')}>
        <Heading level="h2">Dynamic Items ({items.length})</Heading>
        <Paragraph>
          Items animate smoothly when added, removed, or reordered.
        </Paragraph>
        <Collection
          id="dynamic-items-collection"
          items={items}
          layout={layout}
          keyExtractor={(item: Item) => item.id}
          renderItem={renderItem}
          selectionMode="none"
          animate
          aria-label="Dynamic items collection"
        />
      </div>
    </div>
  );
}

export const DynamicItemsStory = meta.story({
  name: 'Dynamic Items (Layout Animations)',
  render: () => <DynamicItemsDemo />,
});

// =========================================
// Virtualized Renderer Story (Large Lists)
// =========================================

type VirtualizedItem = {
  id: string;
  name: string;
  description: string;
  color: NodeColorSequence;
};

// Generate a large list of items for virtualization demo
function generateLargeItemList(count: number): VirtualizedItem[] {
  const colors: NodeColorSequence[] = [
    'node-color-seq-1',
    'node-color-seq-2',
    'node-color-seq-3',
    'node-color-seq-4',
    'node-color-seq-5',
    'node-color-seq-6',
    'node-color-seq-7',
    'node-color-seq-8',
  ];

  // Reset faker seed for consistent generation
  faker.seed(123);

  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription().slice(0, 60),
    color: colors[i % colors.length]!,
  }));
}

type VirtualizedStoryArgs = {
  itemCount: number;
  layoutType: 'list' | 'grid' | 'inlineGrid';
  virtualized: boolean;
  overscan: number;
  gap: number;
  animate: boolean;
};

function VirtualizedStoryRender({
  itemCount,
  layoutType,
  virtualized,
  overscan,
  gap,
  animate,
}: VirtualizedStoryArgs) {
  const items = useMemo(() => generateLargeItemList(itemCount), [itemCount]);

  const layout = useMemo(() => {
    switch (layoutType) {
      case 'grid':
        return new GridLayout<VirtualizedItem>({
          gap,
          minItemWidth: 200,
        });
      case 'inlineGrid':
        return new InlineGridLayout<VirtualizedItem>({
          gap,
        });
      case 'list':
      default:
        return new ListLayout<VirtualizedItem>({ gap });
    }
  }, [layoutType, gap]);

  const renderItem = useCallback(
    (item: VirtualizedItem, itemProps: ItemProps) => {
      if (layoutType === 'inlineGrid') {
        const isSelected = itemProps['data-selected'] === true;
        const isDisabled = itemProps['data-disabled'] === true;

        const {
          ref,
          onFocus,
          onClick,
          onKeyDown,
          onPointerDown,
          onPointerMove,
          ...restProps
        } = itemProps;

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
            label={item.name.split(' ')[0]}
            color={item.color}
            selected={isSelected}
            disabled={isDisabled}
          />
        );
      }

      return (
        <div
          {...itemProps}
          className={cx(
            'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-3 transition-colors',
            'data-selected:bg-accent data-selected:text-accent-contrast',
            'focusable',
          )}
        >
          <Heading level="label">{item.name}</Heading>
          <Paragraph className="text-sm">{item.description}</Paragraph>
        </div>
      );
    },
    [layoutType],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">
        Virtualized Collection ({items.length.toLocaleString()} items)
      </Heading>
      <Paragraph>
        {virtualized
          ? `Scroll through ${items.length.toLocaleString()} items with smooth performance. Only visible items are rendered (check DevTools).`
          : `All ${items.length.toLocaleString()} items rendered (may be slow with large counts).`}
      </Paragraph>
      <Collection
        id="virtualized-collection"
        items={items}
        layout={layout}
        keyExtractor={(item: VirtualizedItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        virtualized={virtualized}
        overscan={overscan}
        animate={animate}
        aria-label="Virtualized collection"
      />
    </div>
  );
}

export const VirtualizedRendererStory = meta.story({
  name: 'Virtualized (Large Lists)',
  args: {
    itemCount: 1000,
    layoutType: 'list',
    virtualized: true,
    overscan: 5,
    gap: 8,
    animate: true,
  },
  argTypes: {
    itemCount: {
      control: 'select' as const,
      options: [100, 500, 1000, 5000, 10000],
      description: 'Number of items to generate',
      table: { category: 'Data' },
    },
    layoutType: {
      control: 'select' as const,
      options: ['list', 'grid', 'inlineGrid'],
      description: 'The layout algorithm to use',
      table: { category: 'Layout' },
    },
    gap: {
      control: { type: 'range' as const, min: 0, max: 24, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    virtualized: {
      control: 'boolean' as const,
      description: 'Enable virtualization (only render visible items)',
      table: { category: 'Performance' },
    },
    overscan: {
      control: 'select' as const,
      options: [1, 3, 5, 10],
      description: 'Number of rows to render beyond the viewport',
      table: { category: 'Performance' },
      if: { arg: 'virtualized', eq: true },
    },
    animate: {
      control: 'boolean' as const,
      description: 'Enable stagger enter animation for items',
      table: { category: 'Animation' },
    },
  },
  render: (args) => (
    <VirtualizedStoryRender {...(args as unknown as VirtualizedStoryArgs)} />
  ),
});

// =========================================
// Sorting Stories
// =========================================

type SortableItem = {
  id: string;
  name: string;
  createdAt: Date;
  priority: number;
  completed: boolean;
};

// Generate sample data with varied properties
faker.seed(456);
const sortableItems: SortableItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: faker.commerce.productName(),
  createdAt: faker.date.between({
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31'),
  }),
  priority: faker.number.int({ min: 1, max: 5 }),
  completed: faker.datatype.boolean(),
}));

function SortableItemCard({
  item,
  itemProps,
}: {
  item: SortableItem;
  itemProps: ItemProps;
}) {
  return (
    <div
      {...itemProps}
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-colors',
        'data-selected:bg-accent data-selected:text-accent-contrast data-selected:outline-accent',
        'focusable',
      )}
    >
      <div className="flex items-center justify-between">
        <Heading level="label">{item.name}</Heading>
        <span
          className={cx(
            'rounded-full px-2 py-0.5 text-xs',
            item.completed
              ? 'bg-success/20 text-success'
              : 'bg-warning/20 text-warning',
          )}
        >
          {item.completed ? 'Done' : 'Pending'}
        </span>
      </div>
      <div className="text-surface-1-contrast/70 mt-2 flex gap-4 text-sm">
        <span>Priority: {item.priority}</span>
        <span>Created: {item.createdAt.toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function SortingWithButtonsDemo() {
  const layout = useMemo(() => new ListLayout<SortableItem>({ gap: 8 }), []);

  const renderItem = useCallback(
    (item: SortableItem, itemProps: ItemProps) => (
      <SortableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Sorting with Buttons</Heading>
      <Paragraph>
        Click sort buttons to sort the collection. Click again to toggle
        direction.
      </Paragraph>

      <Collection
        items={sortableItems}
        layout={layout}
        keyExtractor={(item: SortableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Sortable collection"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <CollectionSortButton property="name" type="string" label="Name" />
          <CollectionSortButton
            property="createdAt"
            type="date"
            label="Date Created"
          />
          <CollectionSortButton
            property="priority"
            type="number"
            label="Priority"
          />
          <CollectionSortButton
            property="completed"
            type="boolean"
            label="Status"
          />
          <CollectionSortButton
            property="*"
            type="number"
            label="Original Order"
          />
        </div>
      </Collection>
    </div>
  );
}

export const SortingWithButtonsStory = meta.story({
  name: 'Sorting - With Buttons',
  render: () => <SortingWithButtonsDemo />,
});

function SortingWithSelectDemo() {
  const layout = useMemo(() => new ListLayout<SortableItem>({ gap: 8 }), []);

  const renderItem = useCallback(
    (item: SortableItem, itemProps: ItemProps) => (
      <SortableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Sorting with Select Dropdown</Heading>
      <Paragraph>
        Use the dropdown to select a sort field and toggle direction.
      </Paragraph>

      <Collection
        items={sortableItems}
        layout={layout}
        keyExtractor={(item: SortableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Sortable collection"
      >
        <div className="mb-4">
          <CollectionSortSelect
            options={[
              { property: 'name', label: 'Name', type: 'string' },
              { property: 'createdAt', label: 'Date Created', type: 'date' },
              { property: 'priority', label: 'Priority', type: 'number' },
              { property: 'completed', label: 'Status', type: 'boolean' },
              { property: '*', label: 'Original Order', type: 'number' },
            ]}
            placeholder="Sort by..."
            showClearOption
            showDirectionToggle
          />
        </div>
      </Collection>
    </div>
  );
}

export const SortingWithSelectStory = meta.story({
  name: 'Sorting - With Select',
  render: () => <SortingWithSelectDemo />,
});

function CustomSortControlsDemo() {
  const layout = useMemo(() => new ListLayout<SortableItem>({ gap: 8 }), []);

  const renderItem = useCallback(
    (item: SortableItem, itemProps: ItemProps) => (
      <SortableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  // Custom sort controls using useSortManager hook
  function CustomSortControls() {
    const sortManager = useSortManager();

    return (
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-surface-contrast/70 text-sm">Custom UI:</span>
        <Button
          size="sm"
          variant={sortManager.isSortedBy('name') ? 'default' : 'outline'}
          onClick={() => sortManager.sortBy('name', 'string')}
        >
          Name{' '}
          {sortManager.isSortedBy('name') &&
            (sortManager.sortDirection === 'asc' ? '↑' : '↓')}
        </Button>
        <Button
          size="sm"
          variant={sortManager.isSortedBy('priority') ? 'default' : 'outline'}
          onClick={() => sortManager.sortBy('priority', 'number')}
        >
          Priority{' '}
          {sortManager.isSortedBy('priority') &&
            (sortManager.sortDirection === 'asc' ? '↑' : '↓')}
        </Button>
        <Button
          size="sm"
          variant={sortManager.isSortedBy('*') ? 'default' : 'outline'}
          onClick={() => sortManager.sortBy('*', 'number', 'desc')}
        >
          Newest First
        </Button>
        {sortManager.isSorted && (
          <Button
            size="sm"
            variant="text"
            onClick={() => sortManager.clearSort()}
          >
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Custom Sort Controls</Heading>
      <Paragraph>
        Build your own sort UI using the useSortManager hook.
      </Paragraph>

      <Collection
        items={sortableItems}
        layout={layout}
        keyExtractor={(item: SortableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Sortable collection"
      >
        <CustomSortControls />
      </Collection>
    </div>
  );
}

export const CustomSortControlsStory = meta.story({
  name: 'Sorting - Custom Controls',
  render: () => <CustomSortControlsDemo />,
});

function DefaultSortDemo() {
  const layout = useMemo(() => new ListLayout<SortableItem>({ gap: 8 }), []);

  const renderItem = useCallback(
    (item: SortableItem, itemProps: ItemProps) => (
      <SortableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Default Sort (Uncontrolled)</Heading>
      <Paragraph>
        Collection starts sorted by priority descending (highest first).
      </Paragraph>

      <Collection
        items={sortableItems}
        layout={layout}
        keyExtractor={(item: SortableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Sortable collection"
        defaultSortBy="priority"
        defaultSortDirection="desc"
        defaultSortType="number"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <CollectionSortButton property="name" type="string" label="Name" />
          <CollectionSortButton
            property="priority"
            type="number"
            label="Priority"
          />
          <CollectionSortButton property="createdAt" type="date" label="Date" />
        </div>
      </Collection>
    </div>
  );
}

export const DefaultSortStory = meta.story({
  name: 'Sorting - Default Sort',
  render: () => <DefaultSortDemo />,
});

function ControlledSortDemo() {
  const layout = useMemo(() => new ListLayout<SortableItem>({ gap: 8 }), []);
  const [sortState, setSortState] = useState<{
    property: string | string[] | null;
    direction: 'asc' | 'desc';
    type: 'string' | 'number' | 'date' | 'boolean';
  }>({
    property: 'name',
    direction: 'asc',
    type: 'string',
  });

  const renderItem = useCallback(
    (item: SortableItem, itemProps: ItemProps) => (
      <SortableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Controlled Sort</Heading>
      <Paragraph>
        Sort state is managed externally. Current: {String(sortState.property)}{' '}
        ({sortState.direction})
      </Paragraph>

      <div className="bg-surface-1 mb-4 rounded p-4">
        <Heading level="label" className="mb-2">
          External Controls
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={sortState.property === 'name' ? 'default' : 'outline'}
            onClick={() =>
              setSortState({
                property: 'name',
                direction: 'asc',
                type: 'string',
              })
            }
          >
            Sort by Name
          </Button>
          <Button
            size="sm"
            variant={sortState.property === 'priority' ? 'default' : 'outline'}
            onClick={() =>
              setSortState({
                property: 'priority',
                direction: 'desc',
                type: 'number',
              })
            }
          >
            Sort by Priority
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setSortState((prev) => ({
                ...prev,
                direction: prev.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
          >
            Toggle Direction
          </Button>
        </div>
      </div>

      <Collection
        items={sortableItems}
        layout={layout}
        keyExtractor={(item: SortableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Sortable collection"
        sortBy={sortState.property ?? undefined}
        sortDirection={sortState.direction}
        sortType={sortState.type}
        onSortChange={setSortState}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-surface-contrast/70 self-center text-sm">
            Internal buttons (sync with external state):
          </span>
          <CollectionSortButton property="name" type="string" label="Name" />
          <CollectionSortButton
            property="priority"
            type="number"
            label="Priority"
          />
        </div>
      </Collection>
    </div>
  );
}

export const ControlledSortStory = meta.story({
  name: 'Sorting - Controlled',
  render: () => <ControlledSortDemo />,
});

// =========================================
// Filtering Stories
// =========================================

import { expect, waitFor, within } from 'storybook/test';
import { CollectionFilterInput } from '../components/CollectionFilterInput';
import { useFilterManager } from '../contexts';

// Filter story args type
type FilterStoryArgs = {
  layoutType: 'list' | 'grid';
  gap: number;
  itemCount: number;
  filterDebounceMs: number;
  filterThreshold: number;
  showResultCount: boolean;
  showClearButton: boolean;
  virtualized: boolean;
};

type FilterableItem = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

// Generate sample data for filtering
faker.seed(789);
const filterableItems: FilterableItem[] = Array.from(
  { length: 50 },
  (_, i) => ({
    id: `user-${i + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    department: faker.helpers.arrayElement([
      'Engineering',
      'Design',
      'Marketing',
      'Sales',
      'Support',
    ]),
    role: faker.helpers.arrayElement([
      'Manager',
      'Senior',
      'Junior',
      'Lead',
      'Intern',
    ]),
  }),
);

function FilterableItemCard({
  item,
  itemProps,
}: {
  item: FilterableItem;
  itemProps: ItemProps;
}) {
  return (
    <div
      {...itemProps}
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-colors',
        'data-selected:bg-accent data-selected:text-accent-contrast data-selected:outline-accent',
        'focusable',
      )}
    >
      <div className="flex items-center justify-between">
        <Heading level="label">{item.name}</Heading>
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
          {item.role}
        </span>
      </div>
      <div className="text-surface-1-contrast/70 mt-2 text-sm">
        <div>{item.email}</div>
        <div className="mt-1">{item.department}</div>
      </div>
    </div>
  );
}

function BasicFilteringDemo({
  gap = 8,
  filterDebounceMs = 300,
  filterThreshold = 0.4,
  showResultCount = true,
  showClearButton = true,
}: Partial<FilterStoryArgs>) {
  const layout = useMemo(() => new ListLayout<FilterableItem>({ gap }), [gap]);

  const renderItem = useCallback(
    (item: FilterableItem, itemProps: ItemProps) => (
      <FilterableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Filtering Collection</Heading>
      <Paragraph>
        Search by name, email, department, or role. Uses fuzzy matching powered
        by fuse.js in a Web Worker.
      </Paragraph>

      <Collection
        items={filterableItems}
        layout={layout}
        keyExtractor={(item: FilterableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Filterable collection"
        filterKeys={['name', 'email', 'department', 'role']}
        filterDebounceMs={filterDebounceMs}
        filterFuseOptions={{ threshold: filterThreshold }}
      >
        <div className="mb-4">
          <CollectionFilterInput
            placeholder="Search users..."
            showResultCount={showResultCount}
            showClearButton={showClearButton}
            data-testid="filter-input"
          />
        </div>
      </Collection>
    </div>
  );
}

export const BasicFilteringStory = meta.story({
  name: 'Filtering - Basic',
  args: {
    gap: 8,
    filterDebounceMs: 300,
    filterThreshold: 0.4,
    showResultCount: true,
    showClearButton: true,
  },
  argTypes: {
    gap: {
      control: { type: 'range' as const, min: 0, max: 24, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    filterDebounceMs: {
      control: { type: 'range' as const, min: 0, max: 1000, step: 50 },
      description: 'Debounce delay before search triggers (ms)',
      table: { category: 'Filtering' },
    },
    filterThreshold: {
      control: { type: 'range' as const, min: 0, max: 1, step: 0.1 },
      description: 'Fuzzy matching threshold (0 = exact, 1 = match all)',
      table: { category: 'Filtering' },
    },
    showResultCount: {
      control: 'boolean' as const,
      description: 'Show result count in filter input',
      table: { category: 'Filter Input' },
    },
    showClearButton: {
      control: 'boolean' as const,
      description: 'Show clear button in filter input',
      table: { category: 'Filter Input' },
    },
  },
  render: (args) => (
    <BasicFilteringDemo {...(args as Partial<FilterStoryArgs>)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByPlaceholderText('Search users...'),
    ).toBeInTheDocument();
  },
});

function FilteringWithSortingDemo({
  gap = 8,
  filterDebounceMs = 300,
}: Partial<FilterStoryArgs>) {
  const layout = useMemo(() => new ListLayout<FilterableItem>({ gap }), [gap]);

  const renderItem = useCallback(
    (item: FilterableItem, itemProps: ItemProps) => (
      <FilterableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Filtering + Sorting</Heading>
      <Paragraph>
        Combine filtering and sorting. Filter narrows results, then sort orders
        them.
      </Paragraph>

      <Collection
        items={filterableItems}
        layout={layout}
        keyExtractor={(item: FilterableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Filterable and sortable collection"
        filterKeys={['name', 'email', 'department', 'role']}
        filterDebounceMs={filterDebounceMs}
      >
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <CollectionFilterInput placeholder="Search..." className="flex-1" />
          <div className="flex gap-2" data-testid="sort-buttons">
            <CollectionSortButton property="name" type="string" label="Name" />
            <CollectionSortButton
              property="department"
              type="string"
              label="Department"
            />
            <CollectionSortButton property="role" type="string" label="Role" />
          </div>
        </div>
      </Collection>
    </div>
  );
}

export const FilteringWithSortingStory = meta.story({
  name: 'Filtering - With Sorting',
  args: {
    gap: 8,
    filterDebounceMs: 300,
  },
  argTypes: {
    gap: {
      control: { type: 'range' as const, min: 0, max: 24, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    filterDebounceMs: {
      control: { type: 'range' as const, min: 0, max: 1000, step: 50 },
      description: 'Debounce delay before search triggers (ms)',
      table: { category: 'Filtering' },
    },
  },
  render: (args) => (
    <FilteringWithSortingDemo {...(args as Partial<FilterStoryArgs>)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByPlaceholderText('Search...')).toBeInTheDocument();
  },
});

// Generate a large list for performance testing
function generateLargeFilterList(count: number): FilterableItem[] {
  faker.seed(999);
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    department: faker.helpers.arrayElement([
      'Engineering',
      'Design',
      'Marketing',
      'Sales',
      'Support',
      'HR',
      'Finance',
      'Legal',
      'Operations',
      'Product',
    ]),
    role: faker.helpers.arrayElement([
      'Manager',
      'Senior',
      'Junior',
      'Lead',
      'Intern',
      'Director',
      'VP',
      'Associate',
    ]),
  }));
}

function LargeListFilteringDemo({
  gap = 4,
  itemCount = 5000,
  filterDebounceMs = 300,
  filterThreshold = 0.4,
  virtualized = true,
}: Partial<FilterStoryArgs>) {
  const items = useMemo(() => generateLargeFilterList(itemCount), [itemCount]);

  const layout = useMemo(() => new ListLayout<FilterableItem>({ gap }), [gap]);

  const renderItem = useCallback(
    (item: FilterableItem, itemProps: ItemProps) => (
      <FilterableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">
        Large List Filtering ({items.length.toLocaleString()} items)
      </Heading>
      <Paragraph>
        Fuzzy search runs in a Web Worker to keep the UI responsive. Try typing
        quickly - the debounce is set to {filterDebounceMs}ms.
        {virtualized ? ' The entire list is virtualized.' : ''}
      </Paragraph>

      <Collection
        items={items}
        layout={layout}
        keyExtractor={(item: FilterableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        virtualized={virtualized}
        animate
        aria-label="Large filterable collection"
        filterKeys={['name', 'email', 'department', 'role']}
        filterDebounceMs={filterDebounceMs}
        filterFuseOptions={{ threshold: filterThreshold }}
      >
        <div className="mb-4">
          <CollectionFilterInput
            placeholder="Search thousands of users..."
            showResultCount
          />
        </div>
      </Collection>
    </div>
  );
}

export const LargeListFilteringStory = meta.story({
  name: 'Filtering - Large List (Web Worker)',
  args: {
    gap: 4,
    itemCount: 5000,
    filterDebounceMs: 300,
    filterThreshold: 0.4,
    virtualized: true,
  },
  argTypes: {
    gap: {
      control: { type: 'range' as const, min: 0, max: 16, step: 2 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    itemCount: {
      control: 'select' as const,
      options: [100, 500, 1000, 5000, 10000],
      description: 'Number of items to generate',
      table: { category: 'Data' },
    },
    filterDebounceMs: {
      control: { type: 'range' as const, min: 0, max: 1000, step: 50 },
      description: 'Debounce delay before search triggers (ms)',
      table: { category: 'Filtering' },
    },
    filterThreshold: {
      control: { type: 'range' as const, min: 0, max: 1, step: 0.1 },
      description: 'Fuzzy matching threshold (0 = exact, 1 = match all)',
      table: { category: 'Filtering' },
    },
    virtualized: {
      control: 'boolean' as const,
      description: 'Enable virtualization (only render visible items)',
      table: { category: 'Performance' },
    },
  },
  render: (args) => (
    <LargeListFilteringDemo {...(args as Partial<FilterStoryArgs>)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for collection and Web Worker to initialize
    // Chromatic has a 15 second limit for interaction tests
    await waitFor(
      () => {
        void expect(
          canvas.getByPlaceholderText('Search thousands of users...'),
        ).toBeInTheDocument();
      },
      { timeout: 25000 },
    );
  },
});

function CustomFilterControlsDemo({
  gap = 8,
  filterDebounceMs = 300,
}: Partial<FilterStoryArgs>) {
  const layout = useMemo(() => new ListLayout<FilterableItem>({ gap }), [gap]);

  const renderItem = useCallback(
    (item: FilterableItem, itemProps: ItemProps) => (
      <FilterableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  // Custom filter controls using useFilterManager hook
  function CustomFilterControls() {
    const filterManager = useFilterManager();

    return (
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={filterManager.query}
          onChange={(e) => filterManager.setQuery(e.target.value)}
          placeholder="Custom input..."
          className="bg-input text-input-contrast focusable rounded px-4 py-2"
          data-testid="custom-filter-input"
        />
        {filterManager.hasActiveFilter && (
          <span className="text-sm opacity-70" data-testid="match-count">
            Found {filterManager.matchCount} matches
          </span>
        )}
        {filterManager.isFiltering && (
          <span
            className="text-sm opacity-50"
            data-testid="searching-indicator"
          >
            Searching...
          </span>
        )}
        {filterManager.hasActiveFilter && (
          <Button
            size="sm"
            variant="text"
            onClick={() => filterManager.clearFilter()}
            data-testid="custom-clear-button"
          >
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Custom Filter Controls</Heading>
      <Paragraph>
        Build your own filter UI using the useFilterManager hook.
      </Paragraph>

      <Collection
        items={filterableItems}
        layout={layout}
        keyExtractor={(item: FilterableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Custom filtered collection"
        filterKeys={['name', 'email', 'department', 'role']}
        filterDebounceMs={filterDebounceMs}
      >
        <CustomFilterControls />
      </Collection>
    </div>
  );
}

export const CustomFilterControlsStory = meta.story({
  name: 'Filtering - Custom Controls',
  args: {
    gap: 8,
    filterDebounceMs: 300,
  },
  argTypes: {
    gap: {
      control: { type: 'range' as const, min: 0, max: 24, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
    filterDebounceMs: {
      control: { type: 'range' as const, min: 0, max: 1000, step: 50 },
      description: 'Debounce delay before search triggers (ms)',
      table: { category: 'Filtering' },
    },
  },
  render: (args) => (
    <CustomFilterControlsDemo {...(args as Partial<FilterStoryArgs>)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('custom-filter-input')).toBeInTheDocument();
  },
});

function ControlledFilterDemo({ gap = 8 }: Partial<FilterStoryArgs>) {
  const layout = useMemo(() => new ListLayout<FilterableItem>({ gap }), [gap]);

  const [filterQuery, setFilterQuery] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const handleFilterResultsChange = useCallback(
    (_matchingKeys: Set<string | number>, count: number) => {
      setMatchCount(count);
    },
    [],
  );

  const renderItem = useCallback(
    (item: FilterableItem, itemProps: ItemProps) => (
      <FilterableItemCard item={item} itemProps={itemProps} />
    ),
    [],
  );

  return (
    <div className={cx(collectionClasses, 'h-full')}>
      <Heading level="h2">Controlled Filter</Heading>
      <Paragraph data-testid="current-query-display">
        Filter state is managed externally. Current query: &quot;{filterQuery}
        &quot;
        {matchCount !== null && ` (${matchCount} results)`}
      </Paragraph>

      <div className="bg-surface-1 mb-4 rounded p-4">
        <Heading level="label" className="mb-2">
          External Controls
        </Heading>
        <div className="flex flex-wrap gap-2" data-testid="external-controls">
          <Button
            size="sm"
            variant={filterQuery === '' ? 'default' : 'outline'}
            onClick={() => setFilterQuery('')}
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filterQuery === 'Engineering' ? 'default' : 'outline'}
            onClick={() => setFilterQuery('Engineering')}
            data-testid="filter-engineering"
          >
            Engineering
          </Button>
          <Button
            size="sm"
            variant={filterQuery === 'Design' ? 'default' : 'outline'}
            onClick={() => setFilterQuery('Design')}
            data-testid="filter-design"
          >
            Design
          </Button>
          <Button
            size="sm"
            variant={filterQuery === 'Manager' ? 'default' : 'outline'}
            onClick={() => setFilterQuery('Manager')}
            data-testid="filter-managers"
          >
            Managers
          </Button>
        </div>
      </div>

      <Collection
        items={filterableItems}
        layout={layout}
        keyExtractor={(item: FilterableItem) => item.id}
        renderItem={renderItem}
        selectionMode="multiple"
        animate
        aria-label="Controlled filtered collection"
        filterKeys={['name', 'email', 'department', 'role']}
        filterQuery={filterQuery}
        onFilterChange={setFilterQuery}
        onFilterResultsChange={handleFilterResultsChange}
      >
        <div className="mb-4">
          <CollectionFilterInput placeholder="Or type here..." />
        </div>
      </Collection>
    </div>
  );
}

export const ControlledFilterStory = meta.story({
  name: 'Filtering - Controlled',
  args: {
    gap: 8,
  },
  argTypes: {
    gap: {
      control: { type: 'range' as const, min: 0, max: 24, step: 4 },
      description: 'Gap between items in pixels',
      table: { category: 'Layout' },
    },
  },
  render: (args) => (
    <ControlledFilterDemo {...(args as Partial<FilterStoryArgs>)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('external-controls')).toBeInTheDocument();
  },
});
