'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { GridLayout, ListLayout } from '../layout';
import { type ItemRenderState, type Key } from '../types';

type Item = {
  id: string;
  name: string;
  description: string;
};

const generateItems = (count: number): Item[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1}`,
  }));
};

type CollectionItemProps = {
  item: Item;
  state?: ItemRenderState;
  compact?: boolean;
};

const CollectionItem = ({ item, state, compact }: CollectionItemProps) => {
  return (
    <Surface
      level={1}
      spacing={compact ? 'xs' : 'sm'}
      elevation="low"
      noContainer
      className={cx(
        'border-2 border-transparent transition-colors duration-300',
        state?.isSelected && 'border-selected',
      )}
    >
      <Heading level="label" margin="none">
        {item.name}
      </Heading>
      {!compact && (
        <Paragraph intent="smallText" emphasis="muted" margin="none">
          {item.description}
        </Paragraph>
      )}
    </Surface>
  );
};

const meta: Meta<typeof Collection> = {
  title: 'Systems/Collection/Virtualization',
  component: Collection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const LargeList: Story = {
  render: function LargeListRender() {
    const items = useMemo(() => generateItems(10000), []);
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 72,
          gap: 8,
          virtualized: true,
          padding: 16,
        }),
      [],
    );

    return (
      <div style={{ height: '600px' }} className="border-border border">
        <Collection
          items={items}
          keyExtractor={(item) => item.id}
          layout={layout}
          renderItem={(item) => <CollectionItem item={item} />}
          aria-label="Large list of items"
        />
      </div>
    );
  },
};

export const LargeListWithSelection: Story = {
  render: function LargeListWithSelectionRender() {
    const items = useMemo(() => generateItems(10000), []);
    const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 72,
          gap: 8,
          virtualized: true,
          padding: 16,
        }),
      [],
    );

    return (
      <div className="flex flex-col gap-4">
        <Paragraph margin="none">
          Selected: {selectedKeys.size} items
          {selectedKeys.size > 0 && (
            <button
              onClick={() => {
                setSelectedKeys(new Set());
              }}
              className="text-primary ml-4 underline"
            >
              Clear Selection
            </button>
          )}
        </Paragraph>
        <div style={{ height: '600px' }} className="border-border border">
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            layout={layout}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            renderItem={(item, state) => (
              <CollectionItem item={item} state={state} />
            )}
            aria-label="Large list with selection"
          />
        </div>
      </div>
    );
  },
};

export const VariableHeightItems: Story = {
  render: function VariableHeightItemsRender() {
    const items = useMemo(
      () =>
        Array.from({ length: 5000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i + 1}`,
          description:
            i % 3 === 0
              ? `Short description for item ${i + 1}`
              : i % 3 === 1
                ? `Medium length description for item ${i + 1}. This one has a bit more text to make it take up more vertical space.`
                : `Long description for item ${i + 1}. This description is intentionally verbose to demonstrate variable height items in the virtualized list. It contains multiple sentences and should wrap to several lines depending on the container width.`,
        })),
      [],
    );
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 80,
          gap: 8,
          virtualized: true,
          padding: 16,
        }),
      [],
    );

    return (
      <div style={{ height: '600px' }} className="border-border border">
        <Collection
          items={items}
          keyExtractor={(item) => item.id}
          layout={layout}
          renderItem={(item) => <CollectionItem item={item} />}
          aria-label="Variable height items"
        />
      </div>
    );
  },
};

export const WithOverscan: Story = {
  render: function WithOverscanRender() {
    const items = useMemo(() => generateItems(10000), []);
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 72,
          gap: 8,
          virtualized: true,
          padding: 16,
        }),
      [],
    );

    return (
      <div className="flex flex-col gap-4">
        <Paragraph margin="none">
          Overscan of 10 items keeps more items rendered for smoother scrolling
        </Paragraph>
        <div style={{ height: '600px' }} className="border-border border">
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            layout={layout}
            overscan={10}
            renderItem={(item) => <CollectionItem item={item} />}
            aria-label="List with overscan"
          />
        </div>
      </div>
    );
  },
};

export const EmptyState: Story = {
  render: function EmptyStateRender() {
    const layout = useMemo(
      () => new ListLayout<Item>({ virtualized: true, padding: 16 }),
      [],
    );

    return (
      <div style={{ height: '400px' }} className="border-border border">
        <Collection
          items={[]}
          keyExtractor={(item: Item) => item.id}
          layout={layout}
          renderItem={(item: Item) => <CollectionItem item={item} />}
          emptyState={
            <div className="flex h-full items-center justify-center p-12">
              <Paragraph emphasis="muted" margin="none">
                No items to display
              </Paragraph>
            </div>
          }
          aria-label="Empty list"
        />
      </div>
    );
  },
};

export const CompactList: Story = {
  render: function CompactListRender() {
    const items = useMemo(() => generateItems(10000), []);
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 48,
          gap: 4,
          virtualized: true,
          padding: 8,
        }),
      [],
    );

    return (
      <div style={{ height: '600px' }} className="border-border border">
        <Collection
          items={items}
          keyExtractor={(item) => item.id}
          layout={layout}
          renderItem={(item) => <CollectionItem item={item} compact />}
          aria-label="Compact list"
        />
      </div>
    );
  },
};

export const WithGaps: Story = {
  render: function WithGapsRender() {
    const items = useMemo(() => generateItems(5000), []);
    const layout = useMemo(
      () =>
        new ListLayout<Item>({
          estimatedRowHeight: 72,
          gap: 16,
          virtualized: true,
          padding: 16,
        }),
      [],
    );

    return (
      <div style={{ height: '600px' }} className="border-border border">
        <Collection
          items={items}
          keyExtractor={(item) => item.id}
          layout={layout}
          renderItem={(item) => <CollectionItem item={item} />}
          aria-label="List with gaps"
        />
      </div>
    );
  },
};

export const GridLayoutStory: Story = {
  name: 'Grid Layout',
  render: function GridLayoutRender() {
    const items = useMemo(() => generateItems(1000), []);
    const layout = useMemo(
      () =>
        new GridLayout<Item>({
          minItemWidth: 250,
          estimatedItemHeight: 100,
          gap: 16,
          virtualized: true,
        }),
      [],
    );

    return (
      <div style={{ height: '600px' }} className="border-border border">
        <Collection
          items={items}
          keyExtractor={(item) => item.id}
          layout={layout}
          renderItem={(item) => <CollectionItem item={item} />}
          aria-label="Grid of items"
        />
      </div>
    );
  },
};

export const GridWithSelection: Story = {
  render: function GridWithSelectionRender() {
    const items = useMemo(() => generateItems(500), []);
    const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
    const layout = useMemo(
      () =>
        new GridLayout<Item>({
          minItemWidth: 180,
          estimatedItemHeight: 100,
          gap: 12,
          virtualized: true,
        }),
      [],
    );

    return (
      <div className="flex flex-col gap-4">
        <Paragraph margin="none">
          Selected: {selectedKeys.size} items
          {selectedKeys.size > 0 && (
            <button
              onClick={() => {
                setSelectedKeys(new Set());
              }}
              className="text-primary ml-4 underline"
            >
              Clear Selection
            </button>
          )}
        </Paragraph>
        <div style={{ height: '600px' }} className="border-border border">
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            layout={layout}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            renderItem={(item, state) => (
              <CollectionItem item={item} state={state} />
            )}
            aria-label="Selectable grid of items"
          />
        </div>
      </div>
    );
  },
};

export const NonVirtualizedList: Story = {
  name: 'Non-Virtualized List (CSS Layout)',
  render: function NonVirtualizedListRender() {
    const items = useMemo(() => generateItems(50), []);
    const layout = useMemo(
      () => new ListLayout<Item>({ gap: 8, virtualized: false }),
      [],
    );

    return (
      <div className="flex flex-col gap-4">
        <Paragraph margin="none">
          This list uses CSS flexbox for layout (non-virtualized). Good for
          smaller lists where virtualization overhead isn&apos;t needed.
        </Paragraph>
        <div
          style={{ height: '400px' }}
          className="border-border overflow-auto border p-4"
        >
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            layout={layout}
            renderItem={(item) => <CollectionItem item={item} />}
            aria-label="Non-virtualized list"
          />
        </div>
      </div>
    );
  },
};

export const NonVirtualizedGrid: Story = {
  name: 'Non-Virtualized Grid (CSS Layout)',
  render: function NonVirtualizedGridRender() {
    const items = useMemo(() => generateItems(24), []);
    const layout = useMemo(
      () =>
        new GridLayout<Item>({
          minItemWidth: 200,
          gap: 16,
          virtualized: false,
        }),
      [],
    );

    return (
      <div className="flex flex-col gap-4">
        <Paragraph margin="none">
          This grid uses CSS grid for layout (non-virtualized). Good for smaller
          grids where virtualization overhead isn&apos;t needed.
        </Paragraph>
        <div
          style={{ height: '500px' }}
          className="border-border overflow-auto border p-4"
        >
          <Collection
            items={items}
            keyExtractor={(item) => item.id}
            layout={layout}
            renderItem={(item) => <CollectionItem item={item} />}
            aria-label="Non-virtualized grid"
          />
        </div>
      </div>
    );
  },
};
