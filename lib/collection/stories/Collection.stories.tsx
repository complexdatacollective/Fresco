'use client';

import { faker } from '@faker-js/faker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { expect, within } from 'storybook/test';
import preview from '~/.storybook/preview';
import Node, { type NodeColorSequence } from '~/components/Node';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { CollectionFilterInput } from '../components/CollectionFilterInput';
import { CollectionSortButton } from '../components/CollectionSortButton';
import { CollectionSortSelect } from '../components/CollectionSortSelect';
import { type DropEvent } from '../dnd/types';
import { useDragAndDrop } from '../dnd/useDragAndDrop';
import { GridLayout } from '../layout/GridLayout';
import { InlineGridLayout } from '../layout/InlineGridLayout';
import { type Layout } from '../layout/Layout';
import { ListLayout } from '../layout/ListLayout';
import { type ItemProps, type Key, type SelectionMode } from '../types';

// =========================================
// Shared types and data
// =========================================

type DemoItem = {
  id: string;
  name: string;
  description: string;
  color: NodeColorSequence;
  department: string;
  role: string;
  createdAt: Date;
  priority: number;
  completed: boolean;
};

type LayoutType = 'list' | 'grid' | 'inlineGrid';
type SortUIType = 'buttons' | 'select' | 'none';

const NODE_COLORS: NodeColorSequence[] = [
  'node-color-seq-1',
  'node-color-seq-2',
  'node-color-seq-3',
  'node-color-seq-4',
  'node-color-seq-5',
  'node-color-seq-6',
  'node-color-seq-7',
  'node-color-seq-8',
];

function generateDemoItems(count: number, seed = 123): DemoItem[] {
  faker.seed(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: faker.person.fullName(),
    description: faker.commerce.productDescription().slice(0, 60),
    color: NODE_COLORS[i % NODE_COLORS.length]!,
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
    createdAt: faker.date.between({
      from: new Date('2024-01-01'),
      to: new Date('2024-12-31'),
    }),
    priority: faker.number.int({ min: 1, max: 5 }),
    completed: faker.datatype.boolean(),
  }));
}

const collectionClasses =
  'w-full flex flex-col gap-8 bg-surface text-surface-contrast publish-colors p-6 rounded';

// =========================================
// Item renderers
// =========================================

function CardItem({
  item,
  itemProps,
}: {
  item: DemoItem;
  itemProps: ItemProps;
}) {
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
      <div className="text-surface-1-contrast/70 mt-2 flex flex-wrap gap-4 text-sm">
        <span>{item.department}</span>
        <span>{item.role}</span>
        <span>Priority: {item.priority}</span>
      </div>
    </div>
  );
}

function NodeItemRenderer({
  item,
  itemProps,
}: {
  item: DemoItem;
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

// =========================================
// Layout helper
// =========================================

function createLayout(
  layoutType: LayoutType,
  gap: number,
  minItemWidth: number,
): Layout<DemoItem> {
  switch (layoutType) {
    case 'grid':
      return new GridLayout<DemoItem>({ gap, minItemWidth });
    case 'inlineGrid':
      return new InlineGridLayout<DemoItem>({ gap });
    case 'list':
    default:
      return new ListLayout<DemoItem>({ gap });
  }
}

// =========================================
// Sort UI component
// =========================================

const SORT_BUTTON_OPTIONS = [
  { property: 'name', type: 'string', label: 'Name' },
  { property: 'createdAt', type: 'date', label: 'Date' },
  { property: 'priority', type: 'number', label: 'Priority' },
  { property: 'completed', type: 'boolean', label: 'Status' },
  { property: '*', type: 'number', label: 'Original Order' },
] as const;

const SORT_SELECT_OPTIONS = SORT_BUTTON_OPTIONS.map((opt) => ({
  property: opt.property,
  label: opt.label,
  type: opt.type,
}));

function SortUI({ sortUIType }: { sortUIType: SortUIType }) {
  if (sortUIType === 'none') return null;

  if (sortUIType === 'select') {
    return (
      <CollectionSortSelect
        options={SORT_SELECT_OPTIONS}
        placeholder="Sort by..."
        showClearOption
        showDirectionToggle
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SORT_BUTTON_OPTIONS.map((opt) => (
        <CollectionSortButton
          key={opt.property}
          property={opt.property}
          type={opt.type}
          label={opt.label}
        />
      ))}
    </div>
  );
}

// =========================================
// Primary story
// =========================================

type PrimaryStoryArgs = {
  layoutType: LayoutType;
  gap: number;
  minItemWidth: number;
  itemComponent: 'card' | 'node';
  selectionMode: SelectionMode;
  disabledItemCount: number;
  animate: boolean;
  virtualized: boolean;
  overscan: number;
  itemCount: number;
  sortUIType: SortUIType;
  filterEnabled: boolean;
  filterDebounceMs: number;
  filterThreshold: number;
};

function PrimaryStoryRender(args: PrimaryStoryArgs) {
  const {
    layoutType,
    gap,
    minItemWidth,
    itemComponent,
    selectionMode,
    disabledItemCount,
    animate,
    virtualized,
    overscan,
    itemCount,
    sortUIType,
    filterEnabled,
    filterDebounceMs,
    filterThreshold,
  } = args;

  const [items, setItems] = useState(() => generateDemoItems(itemCount));
  const nextIdRef = useRef(itemCount + 1);

  useEffect(() => {
    setItems(generateDemoItems(itemCount));
    nextIdRef.current = itemCount + 1;
  }, [itemCount]);

  const addItem = useCallback(() => {
    const id = nextIdRef.current++;
    const [newItem] = generateDemoItems(1, id);
    if (!newItem) return;
    setItems((prev) => [...prev, { ...newItem, id: `item-${id}` }]);
  }, []);

  const removeItem = useCallback(() => {
    setItems((prev) => prev.slice(0, -1));
  }, []);

  const disabledKeys = useMemo(
    () => items.slice(0, disabledItemCount).map((item) => item.id),
    [items, disabledItemCount],
  );

  const layout = useMemo(
    () => createLayout(layoutType, gap, minItemWidth),
    [layoutType, gap, minItemWidth],
  );

  const renderItem = useCallback(
    (item: DemoItem, itemProps: ItemProps) => {
      if (itemComponent === 'node') {
        return <NodeItemRenderer item={item} itemProps={itemProps} />;
      }
      return <CardItem item={item} itemProps={itemProps} />;
    },
    [itemComponent],
  );

  const hasSortOrFilter = sortUIType !== 'none' || filterEnabled;

  return (
    <div className={cx(collectionClasses, 'h-screen')}>
      <div className="flex items-center gap-4">
        <button
          onClick={addItem}
          className="focusable bg-surface-1 rounded px-3 py-1 text-sm"
        >
          Add Item
        </button>
        <button
          onClick={removeItem}
          disabled={items.length === 0}
          className="focusable bg-surface-1 rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Remove Item
        </button>
        <span className="text-surface-contrast/60 text-sm">
          {items.length} items
        </span>
      </div>
      <Collection
        items={items}
        layout={layout}
        keyExtractor={(item: DemoItem) => item.id}
        renderItem={renderItem}
        selectionMode={selectionMode}
        disabledKeys={disabledKeys}
        animate={animate}
        virtualized={virtualized}
        overscan={overscan}
        aria-label="Demo collection"
        {...(sortUIType !== 'none' && {
          defaultSortBy: '*',
          defaultSortDirection: 'asc',
        })}
        {...(filterEnabled && {
          filterKeys: ['name', 'department', 'role'] as const,
          filterDebounceMs,
          filterFuseOptions: { threshold: filterThreshold },
        })}
      >
        {hasSortOrFilter && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            {filterEnabled && (
              <CollectionFilterInput
                placeholder="Search..."
                showResultCount
                showClearButton
                className="flex-1"
                data-testid="filter-input"
              />
            )}
            <SortUI sortUIType={sortUIType} />
          </div>
        )}
      </Collection>
    </div>
  );
}

// =========================================
// Drag Drop story
// =========================================

type DragDropStoryArgs = {
  layoutType: LayoutType;
  gap: number;
  minItemWidth: number;
  itemComponent: 'card' | 'node';
  selectionMode: SelectionMode;
  animate: boolean;
};

faker.seed(42);
const initialLeftItems = generateDemoItems(15, 42);
const initialRightItems = generateDemoItems(12, 84);

function DragDropStoryRender(args: DragDropStoryArgs) {
  const {
    layoutType,
    gap,
    minItemWidth,
    itemComponent,
    selectionMode,
    animate,
  } = args;

  const [leftItems, setLeftItems] = useState(initialLeftItems);
  const [rightItems, setRightItems] = useState(initialRightItems);

  const ITEM_TYPE = 'person';

  const handleLeftDrop = useCallback(
    (e: DropEvent) => {
      const itemsToMove = rightItems.filter((item) => e.keys.has(item.id));
      if (itemsToMove.length === 0) return;
      setRightItems((prev) => prev.filter((item) => !e.keys.has(item.id)));
      setLeftItems((prev) => [...prev, ...itemsToMove]);
    },
    [rightItems],
  );

  const handleRightDrop = useCallback(
    (e: DropEvent) => {
      const itemsToMove = leftItems.filter((item) => e.keys.has(item.id));
      if (itemsToMove.length === 0) return;
      setLeftItems((prev) => prev.filter((item) => !e.keys.has(item.id)));
      setRightItems((prev) => [...prev, ...itemsToMove]);
    },
    [leftItems],
  );

  const { dragAndDropHooks: leftDndHooks } = useDragAndDrop<DemoItem>({
    getItems: () => [{ type: ITEM_TYPE, keys: new Set<Key>() }],
    onDrop: handleLeftDrop,
  });

  const { dragAndDropHooks: rightDndHooks } = useDragAndDrop<DemoItem>({
    getItems: () => [{ type: ITEM_TYPE, keys: new Set<Key>() }],
    onDrop: handleRightDrop,
  });

  const leftLayout = useMemo(
    () => createLayout(layoutType, gap, minItemWidth),
    [layoutType, gap, minItemWidth],
  );
  const rightLayout = useMemo(
    () => createLayout(layoutType, gap, minItemWidth),
    [layoutType, gap, minItemWidth],
  );

  const renderItem = useCallback(
    (item: DemoItem, itemProps: ItemProps) => {
      if (itemComponent === 'node') {
        return <NodeItemRenderer item={item} itemProps={itemProps} />;
      }
      return <CardItem item={item} itemProps={itemProps} />;
    },
    [itemComponent],
  );

  const dropZoneClasses = cx(
    'transition-colors',
    'data-[drop-target-valid=true]:bg-accent/10 data-[drop-target-over=true]:bg-accent/20! data-[drop-target-over=true]:ring-accent data-[drop-target-over=true]:ring-2',
  );

  return (
    <div className="flex h-screen gap-8">
      <div className={cx(collectionClasses, 'flex-1')}>
        <Heading level="h2">Team A ({leftItems.length})</Heading>
        <Paragraph>Drag people to move them to the other team.</Paragraph>
        <Collection
          id="team-a-collection"
          className={dropZoneClasses}
          items={leftItems}
          layout={leftLayout}
          keyExtractor={(item: DemoItem) => item.id}
          renderItem={renderItem}
          selectionMode={selectionMode}
          animate={animate}
          dragAndDropHooks={leftDndHooks}
          aria-label="Team A collection"
        />
      </div>

      <div className={cx(collectionClasses, 'flex-1')}>
        <Heading level="h2">Team B ({rightItems.length})</Heading>
        <Paragraph>Drag people to move them to the other team.</Paragraph>
        <Collection
          id="team-b-collection"
          className={dropZoneClasses}
          items={rightItems}
          layout={rightLayout}
          keyExtractor={(item: DemoItem) => item.id}
          renderItem={renderItem}
          selectionMode={selectionMode}
          animate={animate}
          dragAndDropHooks={rightDndHooks}
          aria-label="Team B collection"
        />
      </div>
    </div>
  );
}

// =========================================
// Meta & exports
// =========================================

const meta = preview.meta({
  title: 'Systems/Collection',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

export const Primary = meta.story({
  args: {
    layoutType: 'list',
    gap: 12,
    minItemWidth: 200,
    itemComponent: 'card',
    selectionMode: 'multiple',
    disabledItemCount: 0,
    animate: true,
    virtualized: false,
    overscan: 5,
    itemCount: 20,
    sortUIType: 'buttons',
    filterEnabled: true,
    filterDebounceMs: 300,
    filterThreshold: 0.35,
  },
  argTypes: {
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
      description:
        'Minimum item width for Grid layout (columns auto-calculated)',
      table: { category: 'Layout' },
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
    disabledItemCount: {
      control: { type: 'range' as const, min: 0, max: 20, step: 1 },
      description: 'Number of items to disable (from the start of the list)',
      table: { category: 'Behavior' },
    },
    animate: {
      control: 'boolean' as const,
      description: 'Enable stagger enter animation',
      table: { category: 'Behavior' },
    },
    virtualized: {
      control: 'boolean' as const,
      description: 'Enable virtualization (only render visible items)',
      table: { category: 'Performance' },
    },
    overscan: {
      control: { type: 'range' as const, min: 1, max: 20, step: 1 },
      description: 'Rows to render beyond viewport (when virtualized)',
      table: { category: 'Performance' },
      if: { arg: 'virtualized', eq: true },
    },
    itemCount: {
      control: 'select' as const,
      options: [8, 20, 50, 100, 500, 1000, 5000],
      description: 'Number of items to generate',
      table: { category: 'Data' },
    },
    sortUIType: {
      control: 'select' as const,
      options: ['buttons', 'select', 'none'],
      description: 'Sort UI component to display',
      table: { category: 'Sorting' },
    },
    filterEnabled: {
      control: 'boolean' as const,
      description: 'Enable fuzzy search filtering',
      table: { category: 'Filtering' },
    },
    filterDebounceMs: {
      control: { type: 'range' as const, min: 0, max: 1000, step: 50 },
      description: 'Debounce delay before search triggers (ms)',
      table: { category: 'Filtering' },
      if: { arg: 'filterEnabled', eq: true },
    },
    filterThreshold: {
      control: { type: 'range' as const, min: 0, max: 1, step: 0.1 },
      description: 'Fuzzy matching threshold (0 = exact, 1 = match all)',
      table: { category: 'Filtering' },
      if: { arg: 'filterEnabled', eq: true },
    },
  },
  render: (args) => <PrimaryStoryRender {...(args as PrimaryStoryArgs)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('listbox', { name: 'Demo collection' }),
    ).toBeInTheDocument();
  },
});

const dragDropArgTypes = {
  layoutType: {
    control: 'select' as const,
    options: ['list', 'grid', 'inlineGrid'],
    description: 'Layout algorithm for both collections',
    table: { category: 'Layout' },
  },
  gap: {
    control: { type: 'range' as const, min: 0, max: 48, step: 4 },
    description: 'Gap between items in pixels',
    table: { category: 'Layout' },
  },
  minItemWidth: {
    control: { type: 'range' as const, min: 100, max: 400, step: 20 },
    description: 'Minimum item width for Grid layout',
    table: { category: 'Layout' },
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
    description: 'Enable stagger enter animation',
    table: { category: 'Behavior' },
  },
};

export const DragDropBetweenCollections = meta.story({
  name: 'Drag Drop Between Collections',
  args: {
    layoutType: 'inlineGrid',
    gap: 16,
    minItemWidth: 200,
    itemComponent: 'node',
    selectionMode: 'multiple',
    animate: true,
  },
  argTypes: dragDropArgTypes,
  render: (args) => <DragDropStoryRender {...(args as DragDropStoryArgs)} />,
});
