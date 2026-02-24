'use client';

import { faker } from '@faker-js/faker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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
        textValueExtractor={(item: DemoItem) => item.name}
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
          textValueExtractor={(item: DemoItem) => item.name}
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
          textValueExtractor={(item: DemoItem) => item.name}
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
    docs: {
      description: {
        component: `
# Collection

A feature-rich, accessible collection component for rendering interactive lists and grids with selection, keyboard navigation, sorting, filtering, drag-and-drop, and virtualization.

## Basic Usage

\`\`\`tsx
import { Collection } from '~/lib/collection/components/Collection';
import { ListLayout } from '~/lib/collection/layout/ListLayout';

const layout = new ListLayout({ gap: 8 });

<Collection
  items={items}
  layout={layout}
  keyExtractor={(item) => item.id}
  textValueExtractor={(item) => item.name}
  renderItem={(item, itemProps) => (
    <div {...itemProps}>{item.name}</div>
  )}
  selectionMode="multiple"
  aria-label="My collection"
/>
\`\`\`

## Required Props

| Prop | Type | Description |
|------|------|-------------|
| \`items\` | \`T[]\` | Array of data items to render |
| \`layout\` | \`Layout<T>\` | Layout instance controlling positioning (\`ListLayout\`, \`GridLayout\`, or \`InlineGridLayout\`) |
| \`keyExtractor\` | \`(item: T) => Key\` | Extracts a unique key (string or number) from each item |
| \`textValueExtractor\` | \`(item: T) => string\` | Extracts a text label from each item for type-ahead search and ARIA accessibility |
| \`renderItem\` | \`(item: T, itemProps: ItemProps) => ReactNode\` | Render function for each item. **You must spread \`itemProps\` onto the root element.** |

## Layout System

Three layout strategies are available. Each layout creates its own keyboard navigation delegate.

### ListLayout

Vertical single-column layout using flexbox. Keyboard navigation is Up/Down only.

\`\`\`tsx
new ListLayout({ gap: 8 })
\`\`\`

### GridLayout

CSS Grid with auto-calculated columns based on container width. Supports 2D keyboard navigation (Up/Down/Left/Right).

\`\`\`tsx
new GridLayout({ minItemWidth: 200, gap: 16 })
\`\`\`

### InlineGridLayout

Flexbox wrapping layout where items keep their intrinsic widths. Supports 2D spatial navigation. Best for variable-width items like tags or badges.

\`\`\`tsx
new InlineGridLayout({ gap: 16 })
\`\`\`

## Selection

Set \`selectionMode\` to enable selection behavior:

- **\`'none'\`** (default) - No selection
- **\`'single'\`** - One item at a time; clicking replaces the selection
- **\`'multiple'\`** - Toggle items on/off; supports range and bulk selection

Selected items receive \`data-selected="true"\` and \`aria-selected="true"\` on their \`itemProps\`.

### Controlled vs Uncontrolled

\`\`\`tsx
// Controlled
<Collection
  selectedKeys={selectedKeys}
  onSelectionChange={(keys) => setSelectedKeys(keys)}
  ...
/>

// Uncontrolled
<Collection
  defaultSelectedKeys={['1', '3']}
  ...
/>
\`\`\`

### Disabled Items

Pass \`disabledKeys\` to prevent selection and skip items during keyboard navigation. Disabled items receive \`data-disabled="true"\`.

\`\`\`tsx
<Collection disabledKeys={['item-2', 'item-4']} ... />
\`\`\`

## Keyboard Navigation

The collection implements a roving tabindex pattern. Tab into the collection, then use:

| Key | Action |
|-----|--------|
| Arrow Down / Arrow Up | Move focus to next/previous item |
| Arrow Left / Arrow Right | Move within row (grid layouts only) |
| Home / End | Jump to first/last item |
| Space / Enter | Toggle selection of focused item |
| Ctrl+A / Cmd+A | Select all (multiple mode) |
| Escape | Clear all selections |
| **Type characters** | **Type-ahead search** - jump to matching item by name |

### Type-Ahead Search

When the collection has focus, typing characters accumulates a search string that is prefix-matched against item text values (from \`textValueExtractor\`). The search string resets after 500ms of inactivity. Matching is case-insensitive and wraps around the collection. Disabled items are skipped.

## Sorting

Enable sorting by providing a default sort configuration or controlled sort state. Use the built-in UI components or the \`useSortManager\` context hook for custom UIs.

\`\`\`tsx
<Collection
  defaultSortBy="name"
  defaultSortDirection="asc"
  filterKeys={['name']}  // also enables filtering UI children
  ...
>
  {/* Built-in sort UI components */}
  <CollectionSortButton property="name" type="string" label="Name" />
  <CollectionSortSelect options={sortOptions} />
</Collection>
\`\`\`

### Sort Rules

For multi-field sorting, pass \`sortRules\`:

\`\`\`tsx
const rules = [
  { property: 'department', direction: 'asc', type: 'string' },
  { property: 'priority', direction: 'desc', type: 'number' },
];

<Collection sortRules={rules} ... />
\`\`\`

The special property \`'*'\` sorts by original array order (useful for a "reset" button). Nested properties are supported as arrays: \`['profile', 'displayName']\`.

## Filtering

Enable fuzzy search by providing \`filterKeys\`. This activates a Fuse.js-powered search that runs in a Web Worker to avoid blocking the main thread.

\`\`\`tsx
<Collection
  filterKeys={['name', 'department', 'role']}
  filterDebounceMs={300}
  filterFuseOptions={{ threshold: 0.35 }}
  ...
>
  <CollectionFilterInput placeholder="Search..." showResultCount />
</Collection>
\`\`\`

Results are sorted by relevance score. When combined with user sort rules, relevance acts as the primary sort key with user rules as tiebreakers.

### CollectionFilterInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`placeholder\` | \`string\` | \`"Search..."\` | Input placeholder text |
| \`showClearButton\` | \`boolean\` | \`true\` | Show clear button when query exists |
| \`showResultCount\` | \`boolean\` | \`true\` | Show match count |
| \`showLoadingIndicator\` | \`boolean\` | \`true\` | Show spinner while indexing/searching |
| \`size\` | \`'sm' \\| 'md' \\| 'lg'\` | \`'md'\` | Input size |

## Drag and Drop

Integrate with the DnD system via \`useDragAndDrop\`:

\`\`\`tsx
const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys) => [{ type: 'person', keys }],
  onDrop: (e) => handleDrop(e),
  acceptTypes: ['person'],
});

<Collection dragAndDropHooks={dragAndDropHooks} ... />
\`\`\`

Dragging is multi-select aware: if a selected item is dragged, all selected items move together. Disabled items cannot be dragged.

## Virtualization

For large lists, enable virtualization to only render visible items:

\`\`\`tsx
<Collection
  virtualized
  overscan={5}  // extra rows rendered beyond viewport
  ...
/>
\`\`\`

## Animation

Items animate in with a stagger effect by default. Control this with:

- **\`animate\`** - Enable/disable animations (default: \`true\`)
- **\`animationKey\`** - Change this value to trigger a re-animation

## Context Hooks

Child components rendered inside \`<Collection>\` can access collection state through context hooks:

| Hook | Description |
|------|-------------|
| \`useCollectionStore(selector)\` | Select from the zustand collection store |
| \`useSelectionManager()\` | Access selection state and actions |
| \`useOptionalSortManager()\` | Access sort state (null if sorting not configured) |
| \`useFilterManager()\` | Access filter state (throws if \`filterKeys\` not set) |
| \`useOptionalFilterManager()\` | Access filter state (null if not configured) |
| \`useCollectionId()\` | Get the collection's unique ID |

## ItemProps Data Attributes

The \`itemProps\` passed to \`renderItem\` include data attributes for styling:

| Attribute | When Present |
|-----------|-------------|
| \`data-selected="true"\` | Item is selected |
| \`data-focused="true"\` | Item has keyboard focus |
| \`data-disabled="true"\` | Item is disabled |
| \`data-dragging="true"\` | Item is being dragged |
| \`data-drop-target="true"\` | Item is a valid drop target |
| \`data-collection-item\` | Always present on collection items |

Use these with Tailwind's data attribute variants:

\`\`\`tsx
<div
  {...itemProps}
  className="data-selected:bg-accent data-disabled:opacity-50 data-focused:ring-2"
>
  {item.name}
</div>
\`\`\`

## Empty State

Provide a custom empty state component:

\`\`\`tsx
<Collection
  items={[]}
  emptyState={<div>No items found</div>}
  ...
/>
\`\`\`
`,
      },
    },
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

// =========================================
// Interaction test stories
// =========================================

const interactionTestItems: DemoItem[] = [
  {
    id: 'item-1',
    name: 'Alice Anderson',
    description: 'Test item 1',
    color: 'node-color-seq-1',
    department: 'Engineering',
    role: 'Manager',
    createdAt: new Date('2024-01-01'),
    priority: 1,
    completed: false,
  },
  {
    id: 'item-2',
    name: 'Bob Baker',
    description: 'Test item 2',
    color: 'node-color-seq-2',
    department: 'Design',
    role: 'Senior',
    createdAt: new Date('2024-02-01'),
    priority: 2,
    completed: true,
  },
  {
    id: 'item-3',
    name: 'Charlie Chen',
    description: 'Test item 3',
    color: 'node-color-seq-3',
    department: 'Marketing',
    role: 'Junior',
    createdAt: new Date('2024-03-01'),
    priority: 3,
    completed: false,
  },
  {
    id: 'item-4',
    name: 'Chester Clark',
    description: 'Test item 4',
    color: 'node-color-seq-4',
    department: 'Sales',
    role: 'Lead',
    createdAt: new Date('2024-04-01'),
    priority: 4,
    completed: true,
  },
  {
    id: 'item-5',
    name: 'Diana Davis',
    description: 'Test item 5',
    color: 'node-color-seq-5',
    department: 'Support',
    role: 'Intern',
    createdAt: new Date('2024-05-01'),
    priority: 5,
    completed: false,
  },
];

function InteractionTestRender({
  selectionMode = 'multiple',
  disabledKeys,
}: {
  selectionMode?: SelectionMode;
  disabledKeys?: string[];
}) {
  const layout = useMemo(() => new ListLayout<DemoItem>({ gap: 8 }), []);

  return (
    <div className={cx(collectionClasses, 'h-[400px]')}>
      <Collection
        items={interactionTestItems}
        layout={layout}
        keyExtractor={(item: DemoItem) => item.id}
        textValueExtractor={(item: DemoItem) => item.name}
        renderItem={(item: DemoItem, itemProps: ItemProps) => (
          <div
            {...itemProps}
            data-testid={item.id}
            className={cx(
              'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-3',
              'data-selected:bg-accent data-selected:text-accent-contrast',
              'focusable',
              'data-disabled:opacity-50',
            )}
          >
            {item.name}
          </div>
        )}
        selectionMode={selectionMode}
        disabledKeys={disabledKeys}
        animate={false}
        aria-label="Test collection"
      />
    </div>
  );
}

export const KeyboardNavigation = meta.story({
  name: 'Keyboard Navigation',
  render: () => <InteractionTestRender />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click first item to establish focus
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // ArrowDown moves focus to next item
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByTestId('item-2')).toHaveAttribute(
      'data-focused',
      'true',
    );
    await expect(canvas.getByTestId('item-1')).not.toHaveAttribute(
      'data-focused',
    );

    // ArrowDown again
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // ArrowUp moves focus back
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByTestId('item-2')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Home jumps to first item
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // End jumps to last item
    await userEvent.keyboard('{End}');
    await expect(canvas.getByTestId('item-5')).toHaveAttribute(
      'data-focused',
      'true',
    );
  },
});

export const SingleSelection = meta.story({
  name: 'Single Selection',
  render: () => <InteractionTestRender selectionMode="single" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click item-1 to select it
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // Click item-3 replaces selection (single mode)
    await userEvent.click(canvas.getByTestId('item-3'));
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await expect(canvas.getByTestId('item-1')).not.toHaveAttribute(
      'data-selected',
    );

    // ArrowDown moves focus to item-4
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByTestId('item-4')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Space toggles selection of focused item
    await userEvent.keyboard(' ');
    await expect(canvas.getByTestId('item-4')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await expect(canvas.getByTestId('item-3')).not.toHaveAttribute(
      'data-selected',
    );

    // Space again deselects (toggle off)
    await userEvent.keyboard(' ');
    await expect(canvas.getByTestId('item-4')).not.toHaveAttribute(
      'data-selected',
    );
  },
});

export const MultipleSelection = meta.story({
  name: 'Multiple Selection',
  render: () => <InteractionTestRender selectionMode="multiple" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click item-1 to select
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // Click item-3 adds to selection (toggle behavior)
    await userEvent.click(canvas.getByTestId('item-3'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // Click item-1 again removes it from selection (toggle off)
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).not.toHaveAttribute(
      'data-selected',
    );
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // Ctrl+A selects all items
    await userEvent.keyboard('{Control>}a{/Control}');
    for (let i = 1; i <= 5; i++) {
      await expect(canvas.getByTestId(`item-${i}`)).toHaveAttribute(
        'data-selected',
        'true',
      );
    }

    // Escape clears selection
    await userEvent.keyboard('{Escape}');
    for (let i = 1; i <= 5; i++) {
      await expect(canvas.getByTestId(`item-${i}`)).not.toHaveAttribute(
        'data-selected',
      );
    }
  },
});

export const TypeAheadSearch = meta.story({
  name: 'Type-Ahead Search',
  render: () => <InteractionTestRender />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click first item to establish focus
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Type 'b' to jump to Bob Baker
    await userEvent.keyboard('b');
    await expect(canvas.getByTestId('item-2')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Wait for search string to reset (500ms timeout)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Type 'che' to jump to Chester Clark (accumulated prefix)
    // 'che' does NOT match Charlie Chen ('charlie' starts with 'cha', not 'che')
    // but DOES match Chester Clark ('chester' starts with 'che')
    await userEvent.keyboard('che');
    await expect(canvas.getByTestId('item-4')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Wait for search string to reset
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Type 'd' to jump to Diana Davis
    await userEvent.keyboard('d');
    await expect(canvas.getByTestId('item-5')).toHaveAttribute(
      'data-focused',
      'true',
    );
  },
});

export const DisabledItems = meta.story({
  name: 'Disabled Items',
  render: () => <InteractionTestRender disabledKeys={['item-2', 'item-4']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify disabled items have the disabled attribute
    await expect(canvas.getByTestId('item-2')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    await expect(canvas.getByTestId('item-4')).toHaveAttribute(
      'data-disabled',
      'true',
    );

    // Click item-1 to select and focus
    await userEvent.click(canvas.getByTestId('item-1'));
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-focused',
      'true',
    );
    await expect(canvas.getByTestId('item-1')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // ArrowDown skips disabled item-2, focuses item-3
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-focused',
      'true',
    );
    await expect(canvas.getByTestId('item-2')).not.toHaveAttribute(
      'data-focused',
    );

    // Space selects item-3
    await userEvent.keyboard(' ');
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-selected',
      'true',
    );

    // ArrowDown skips disabled item-4, focuses item-5
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByTestId('item-5')).toHaveAttribute(
      'data-focused',
      'true',
    );
    await expect(canvas.getByTestId('item-4')).not.toHaveAttribute(
      'data-focused',
    );

    // ArrowUp skips disabled item-4, focuses item-3
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByTestId('item-3')).toHaveAttribute(
      'data-focused',
      'true',
    );

    // Disabled items should not be selected
    await expect(canvas.getByTestId('item-2')).not.toHaveAttribute(
      'data-selected',
    );
    await expect(canvas.getByTestId('item-4')).not.toHaveAttribute(
      'data-selected',
    );
  },
});
