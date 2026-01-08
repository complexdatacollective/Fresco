import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { GridLayout, ListLayout } from '../layout';
import { type Node } from '../types';

const meta: Meta = {
  title: 'Systems/Collection/Layout System',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

type MockItem = {
  id: number;
  name: string;
};

// Mock data generator
function createMockItems(count: number): {
  items: Map<number, Node<MockItem>>;
  orderedKeys: number[];
} {
  const items = new Map<number, Node<MockItem>>();
  const orderedKeys: number[] = [];

  for (let i = 0; i < count; i++) {
    orderedKeys.push(i);
    items.set(i, {
      key: i,
      type: 'item',
      value: { id: i, name: `Item ${i}` },
      textValue: `Item ${i}`,
      index: i,
      level: 0,
    });
  }

  return { items, orderedKeys };
}

// List Layout Visualizer
function ListLayoutVisualizer({
  gap = 0,
  itemCount = 10,
}: {
  gap?: number;
  itemCount?: number;
}) {
  const [containerWidth] = useState(600);
  const { items, orderedKeys } = createMockItems(itemCount);

  const layout = new ListLayout({ gap });
  layout.setItems(items, orderedKeys);
  layout.update({ containerWidth });

  const contentSize = layout.getContentSize();
  const layoutInfos = Array.from(orderedKeys).map((key) =>
    layout.getLayoutInfo(key),
  );

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div>Container Width: {containerWidth}px</div>
        <div>Gap: {gap}px</div>
        <div>
          Content Size: {contentSize.width}x{contentSize.height}px
        </div>
      </div>

      <div
        className="border-2 border-blue-500"
        style={{
          width: containerWidth,
          height: Math.min(contentSize.height, 400),
        }}
      >
        <ScrollArea className="h-full" viewportClassName="overflow-x-hidden">
          <div
            className="relative"
            style={{ width: contentSize.width, height: contentSize.height }}
          >
            {layoutInfos.map((info) => {
              if (!info) return null;
              const { rect, key } = info;
              return (
                <div
                  key={key}
                  className="absolute border border-gray-300 bg-blue-100 p-2 text-xs"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                >
                  Item {key} ({rect.width}x{rect.height})
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Grid Layout Visualizer
function GridLayoutVisualizer({
  minItemWidth = 200,
  maxItemWidth,
  gap = 16,
  columns = 'auto' as const,
  itemCount = 12,
}: {
  minItemWidth?: number;
  maxItemWidth?: number;
  gap?: number;
  columns?: number | 'auto';
  itemCount?: number;
}) {
  const [containerWidth] = useState(800);
  const { items, orderedKeys } = createMockItems(itemCount);

  const layout = new GridLayout({
    minItemWidth,
    maxItemWidth,
    gap,
    columns,
  });
  layout.setItems(items, orderedKeys);
  layout.update({ containerWidth });

  const contentSize = layout.getContentSize();
  const layoutInfos = Array.from(orderedKeys).map((key) =>
    layout.getLayoutInfo(key),
  );

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div>Container Width: {containerWidth}px</div>
        <div>Min Item Width: {minItemWidth}px</div>
        {maxItemWidth && <div>Max Item Width: {maxItemWidth}px</div>}
        <div>Gap: {gap}px</div>
        <div>Columns: {columns}</div>
        <div>
          Content Size: {contentSize.width}x{contentSize.height}px
        </div>
      </div>

      <div
        className="border-2 border-green-500"
        style={{
          width: containerWidth,
          height: Math.min(contentSize.height, 500),
        }}
      >
        <ScrollArea className="h-full" viewportClassName="overflow-x-hidden">
          <div
            className="relative"
            style={{ width: contentSize.width, height: contentSize.height }}
          >
            {layoutInfos.map((info) => {
              if (!info) return null;
              const { rect, key } = info;
              return (
                <div
                  key={key}
                  className="absolute border border-gray-300 bg-green-100 p-2 text-xs"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                >
                  Item {key}
                  <div className="text-[10px] text-gray-600">
                    {Math.round(rect.width)}x{rect.height}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Stories
export const ListLayoutBasic: Story = {
  render: () => <ListLayoutVisualizer />,
};

export const ListLayoutWithGap: Story = {
  render: () => <ListLayoutVisualizer gap={8} />,
};

export const ListLayoutLargeGap: Story = {
  render: () => <ListLayoutVisualizer gap={16} />,
};

export const GridLayoutBasic: Story = {
  render: () => <GridLayoutVisualizer />,
};

export const GridLayoutTwoColumns: Story = {
  render: () => <GridLayoutVisualizer columns={2} />,
};

export const GridLayoutThreeColumns: Story = {
  render: () => <GridLayoutVisualizer columns={3} />,
};

export const GridLayoutSmallItems: Story = {
  render: () => <GridLayoutVisualizer minItemWidth={150} gap={12} />,
};

export const GridLayoutWithMaxWidth: Story = {
  render: () => (
    <GridLayoutVisualizer minItemWidth={150} maxItemWidth={250} gap={16} />
  ),
};

// Responsive grid story
function ResponsiveGridVisualizer() {
  const [containerWidth, setContainerWidth] = useState(800);
  const { items, orderedKeys } = createMockItems(12);

  const layout = new GridLayout({
    minItemWidth: 200,
    gap: 16,
    columns: 'auto',
  });
  layout.setItems(items, orderedKeys);
  layout.update({ containerWidth });

  const contentSize = layout.getContentSize();
  const layoutInfos = Array.from(orderedKeys).map((key) =>
    layout.getLayoutInfo(key),
  );

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div>Container Width: {containerWidth}px</div>
        <input
          type="range"
          min="300"
          max="1200"
          step="50"
          value={containerWidth}
          onChange={(e) => setContainerWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div
        className="border-2 border-purple-500"
        style={{
          width: containerWidth,
          height: Math.min(contentSize.height, 500),
        }}
      >
        <ScrollArea className="h-full" viewportClassName="overflow-x-hidden">
          <div
            className="relative"
            style={{ width: contentSize.width, height: contentSize.height }}
          >
            {layoutInfos.map((info) => {
              if (!info) return null;
              const { rect, key } = info;
              return (
                <div
                  key={key}
                  className="absolute border border-gray-300 bg-purple-100 p-2 text-xs"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                >
                  Item {key}
                  <div className="text-[10px] text-gray-600">
                    {Math.round(rect.width)}x{rect.height}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export const ResponsiveGrid: Story = {
  render: () => <ResponsiveGridVisualizer />,
};
