'use client';

import { faker } from '@faker-js/faker';
import { useCallback, useMemo, useState } from 'react';
import preview from '~/.storybook/preview';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Node, { type NodeColorSequence } from '~/lib/ui/components/Node';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { useDragAndDrop, type DropEvent } from '../dnd';
import { GridLayout, InlineGridLayout, ListLayout } from '../layout';
import { type Layout } from '../layout/Layout';
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
  maxItemWidth: number;
  columns: number;
  autoColumns: boolean;
  // InlineGrid-specific options
  itemWidth: number;
  itemHeight: number;
};

// Helper to create layout from args
function createLayout(args: CollectionStoryArgs): Layout<Item> {
  const {
    layoutType,
    gap,
    minItemWidth,
    maxItemWidth,
    columns,
    autoColumns,
    itemWidth,
    itemHeight,
  } = args;

  switch (layoutType) {
    case 'grid':
      return new GridLayout<Item>({
        gap,
        minItemWidth,
        maxItemWidth: maxItemWidth > 0 ? maxItemWidth : undefined,
        columns: autoColumns ? 'auto' : columns,
      });
    case 'inlineGrid':
      return new InlineGridLayout<Item>({
        gap,
        itemWidth,
        itemHeight,
      });
    case 'list':
    default:
      return new ListLayout<Item>({ gap });
  }
}

// Shared render function for all stories
function CollectionStoryRender(args: CollectionStoryArgs) {
  const { layoutType, itemComponent, selectionMode, animate } = args;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const layout = useMemo(
    () => createLayout(args),
    [
      args.layoutType,
      args.gap,
      args.minItemWidth,
      args.maxItemWidth,
      args.columns,
      args.autoColumns,
      args.itemWidth,
      args.itemHeight,
    ],
  );

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
    <div className="flex h-screen w-screen p-8">
      <div className={cx(collectionClasses, 'p-4')}>
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
    </div>
  );
}

// Shared argTypes with conditional controls
const collectionArgTypes = {
  layoutType: {
    control: 'select',
    options: ['list', 'grid', 'inlineGrid'],
    description: 'The layout algorithm to use',
    table: { category: 'Layout' },
  },
  gap: {
    control: { type: 'range', min: 0, max: 48, step: 4 },
    description: 'Gap between items in pixels',
    table: { category: 'Layout' },
  },
  minItemWidth: {
    control: { type: 'range', min: 100, max: 400, step: 20 },
    description: 'Minimum item width for Grid layout',
    table: { category: 'Layout - Grid' },
    if: { arg: 'layoutType', eq: 'grid' },
  },
  maxItemWidth: {
    control: { type: 'range', min: 0, max: 600, step: 20 },
    description: 'Maximum item width for Grid layout (0 = no max)',
    table: { category: 'Layout - Grid' },
    if: { arg: 'layoutType', eq: 'grid' },
  },
  columns: {
    control: { type: 'range', min: 1, max: 6, step: 1 },
    description: 'Number of columns (when autoColumns is false)',
    table: { category: 'Layout - Grid' },
    if: { arg: 'layoutType', eq: 'grid' },
  },
  autoColumns: {
    control: 'boolean',
    description: 'Auto-calculate columns based on container width',
    table: { category: 'Layout - Grid' },
    if: { arg: 'layoutType', eq: 'grid' },
  },
  itemWidth: {
    control: { type: 'range', min: 50, max: 300, step: 10 },
    description: 'Item width for InlineGrid layout',
    table: { category: 'Layout - InlineGrid' },
    if: { arg: 'layoutType', eq: 'inlineGrid' },
  },
  itemHeight: {
    control: { type: 'range', min: 30, max: 200, step: 10 },
    description: 'Item height for InlineGrid layout',
    table: { category: 'Layout - InlineGrid' },
    if: { arg: 'layoutType', eq: 'inlineGrid' },
  },
  itemComponent: {
    control: 'select',
    options: ['card', 'node'],
    description: 'The component to render for each item',
    table: { category: 'Rendering' },
  },
  selectionMode: {
    control: 'select',
    options: ['none', 'single', 'multiple'],
    description: 'Selection behavior',
    table: { category: 'Behavior' },
  },
  animate: {
    control: 'boolean',
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
  maxItemWidth: 0,
  columns: 3,
  autoColumns: true,
  itemWidth: 100,
  itemHeight: 100,
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
        itemWidth: 100,
        itemHeight: 100,
      }),
    [],
  );

  const rightLayout = useMemo(
    () =>
      new InlineGridLayout<Person>({
        gap: 16,
        itemWidth: 100,
        itemHeight: 100,
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
    <div className="flex h-screen w-screen gap-8 p-8">
      <div className={collectionClasses}>
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

      <div className={collectionClasses}>
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
