import type { Meta, StoryObj } from '@storybook/react';
import type { Variants } from 'motion/react';
import React, { useState } from 'react';
import { cn } from '~/utils/shadcn';
import {
  VirtualizedList,
  type AnimationMode,
  type VirtualizedItemRenderProps,
  type VirtualizedListProps,
} from './VirtualizedList';

// ============================================================================
// Sample Data Types
// ============================================================================

type ListItem = {
  id: string;
  title: string;
  description: string;
  category: string;
};

type CardItem = {
  id: string;
  name: string;
  image: string;
  price: number;
};

// ============================================================================
// Sample Data Generators
// ============================================================================

const generateListItems = (count: number): ListItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i + 1}`,
    description: `This is a description for item ${i + 1}. It contains some sample text to demonstrate the list item.`,
    category: ['Category A', 'Category B', 'Category C'][i % 3]!,
  }));

const generateCardItems = (count: number): CardItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    name: `Product ${i + 1}`,
    image: `https://picsum.photos/seed/${i}/200/200`,
    price: Math.floor(Math.random() * 100) + 10,
  }));

// ============================================================================
// Render Functions
// ============================================================================

const renderListItem = (
  item: ListItem,
  _index: number,
  { isSelected, isFocused }: VirtualizedItemRenderProps,
) => (
  <div
    className={cn(
      'border-b p-4',
      'bg-card text-card-foreground',
      'transition-colors duration-150',
      isSelected && 'bg-accent/20',
      isFocused && 'ring-2 ring-inset ring-accent',
    )}
  >
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">{item.title}</h4>
        <p className="mt-1 text-sm opacity-70">{item.description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs">
        {item.category}
      </span>
    </div>
  </div>
);

const renderCardItem = (
  item: CardItem,
  _index: number,
  { isSelected, isFocused }: VirtualizedItemRenderProps,
) => (
  <div
    className={cn(
      'flex h-full flex-col overflow-hidden rounded-lg border',
      'bg-card text-card-foreground',
      'transition-all duration-150',
      isSelected && 'ring-2 ring-accent',
      isFocused && 'ring-2 ring-accent ring-offset-2',
    )}
  >
    <div className="aspect-square bg-muted">
      <div className="flex h-full items-center justify-center text-4xl opacity-30">
        📦
      </div>
    </div>
    <div className="p-3">
      <h4 className="truncate font-medium">{item.name}</h4>
      <p className="mt-1 text-lg font-bold text-accent">${item.price}</p>
    </div>
  </div>
);

const renderHorizontalItem = (
  item: ListItem,
  _index: number,
  { isSelected, isFocused }: VirtualizedItemRenderProps,
) => (
  <div
    className={cn(
      'flex h-full w-48 shrink-0 flex-col rounded-lg border p-4',
      'bg-card text-card-foreground',
      'transition-all duration-150',
      isSelected && 'ring-2 ring-accent',
      isFocused && 'ring-2 ring-accent ring-offset-2',
    )}
  >
    <h4 className="font-medium">{item.title}</h4>
    <p className="mt-2 line-clamp-3 flex-1 text-sm opacity-70">
      {item.description}
    </p>
    <span className="mt-2 self-start rounded-full bg-muted px-2 py-1 text-xs">
      {item.category}
    </span>
  </div>
);

const renderDynamicItem = (
  item: ListItem,
  index: number,
  { isSelected, isFocused }: VirtualizedItemRenderProps,
) => {
  const lines = (index % 4) + 1;
  return (
    <div
      className={cn(
        'border-b p-4',
        'bg-card text-card-foreground',
        'transition-colors duration-150',
        isSelected && 'bg-accent/20',
        isFocused && 'ring-2 ring-inset ring-accent',
      )}
    >
      <h4 className="font-medium">{item.title}</h4>
      {Array.from({ length: lines }).map((_, lineIndex) => (
        <p key={lineIndex} className="mt-1 text-sm opacity-70">
          {item.description}
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<VirtualizedListProps<ListItem>> = {
  title: 'UI/VirtualizedList',
  component: VirtualizedList as unknown as React.ComponentType<VirtualizedListProps<ListItem>>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A high-performance virtualized list component built on @tanstack/react-virtual and Base UI.

## Features

- **Virtualization**: Efficiently renders only visible items, supporting thousands of items
- **Layout Modes**: List, Grid, and Horizontal layouts
- **Selection**: Single and multiple selection with keyboard support
- **Keyboard Navigation**: Full arrow key, Home/End, and Ctrl+A support
- **Accessibility**: ARIA listbox/list roles with proper selection states
- **Animations**: Staggered enter animations and enter/exit transitions
- **Responsive**: Dynamic column responsiveness based on container or item size
- **Dynamic Sizing**: Support for variable height/width items

## Basic Usage

\`\`\`tsx
<VirtualizedList
  items={items}
  getItemKey={(item) => item.id}
  className="h-96 w-full"
>
  {(item, index, { isSelected, isFocused }) => (
    <div className={isSelected ? 'bg-accent' : ''}>
      {item.title}
    </div>
  )}
</VirtualizedList>
\`\`\`

## Selection

Enable selection with the \`selectionMode\` prop:

\`\`\`tsx
<VirtualizedList
  items={items}
  getItemKey={(item) => item.id}
  selectionMode="multiple"
  onSelectionChange={(keys) => console.log('Selected:', keys)}
>
  {(item, index, { isSelected, toggleSelect }) => (
    <div onClick={toggleSelect}>
      {isSelected ? '✓' : ''} {item.title}
    </div>
  )}
</VirtualizedList>
\`\`\`

## Grid Layout

Use \`layout="grid"\` with responsive columns:

\`\`\`tsx
<VirtualizedList
  items={items}
  getItemKey={(item) => item.id}
  layout="grid"
  responsiveColumns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={16}
>
  {(item) => <Card>{item.name}</Card>}
</VirtualizedList>
\`\`\`
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['list', 'grid', 'horizontal'],
      description: 'Layout mode for the list items',
      table: { defaultValue: { summary: 'list' } },
    },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
      description: 'Selection behavior',
      table: { defaultValue: { summary: 'none' } },
    },
    animationMode: {
      control: 'select',
      options: ['none', 'staggered', 'fade', 'slide', 'scale', 'custom'],
      description: 'Animation style for items',
      table: { defaultValue: { summary: 'staggered' } },
    },
    gap: {
      control: { type: 'number', min: 0, max: 32 },
      description: 'Gap between items in pixels (for grid layout)',
      table: { defaultValue: { summary: '8' } },
    },
    overscan: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Number of items to render outside visible area',
      table: { defaultValue: { summary: '5' } },
    },
  },
};

export default meta;
type Story = StoryObj<VirtualizedListProps<ListItem>>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    layout: 'list',
    animationMode: 'staggered',
  },
  render: (args) => (
    <VirtualizedList
      {...args}
      items={generateListItems(100)}
      getItemKey={(item) => item.id}
      className="h-96 w-[500px] border bg-background"
    >
      {renderListItem}
    </VirtualizedList>
  ),
};

export const ListLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Standard vertical list layout. Items are rendered one after another vertically.',
      },
    },
  },
  render: () => (
    <VirtualizedList
      items={generateListItems(1000)}
      getItemKey={(item) => item.id}
      layout="list"
      className="h-96 w-[500px] border bg-background"
    >
      {renderListItem}
    </VirtualizedList>
  ),
};

export const GridLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Grid layout with a fixed number of columns. Perfect for card-based UIs.',
      },
    },
  },
  render: () => (
    <VirtualizedList
      items={generateCardItems(100)}
      getItemKey={(item) => item.id}
      layout="grid"
      columns={3}
      gap={16}
      sizing={{ type: 'fixed', itemSize: 280 }}
      className="h-[500px] w-[600px] border bg-background"
    >
      {renderCardItem}
    </VirtualizedList>
  ),
};

export const HorizontalLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Horizontal scrolling layout. Ideal for carousels or image galleries.',
      },
    },
  },
  render: () => (
    <VirtualizedList
      items={generateListItems(50)}
      getItemKey={(item) => item.id}
      layout="horizontal"
      sizing={{ type: 'fixed', itemSize: 200 }}
      className="h-56 w-[600px] border bg-background"
    >
      {renderHorizontalItem}
    </VirtualizedList>
  ),
};

export const ResponsiveColumns: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid that adjusts column count based on container width. Resize the container to see columns adjust.',
      },
    },
  },
  render: () => (
    <div className="resize-x overflow-auto" style={{ width: 600, minWidth: 300, maxWidth: 900 }}>
      <VirtualizedList
        items={generateCardItems(50)}
        getItemKey={(item) => item.id}
        layout="grid"
        responsiveColumns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
        gap={16}
        sizing={{ type: 'fixed', itemSize: 280 }}
        className="h-[500px] border bg-background"
      >
        {renderCardItem}
      </VirtualizedList>
    </div>
  ),
};

export const AutoColumnsFromItemWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Automatically calculates the number of columns based on a fixed item width.',
      },
    },
  },
  render: () => (
    <div className="resize-x overflow-auto" style={{ width: 600, minWidth: 300, maxWidth: 900 }}>
      <VirtualizedList
        items={generateCardItems(50)}
        getItemKey={(item) => item.id}
        layout="grid"
        autoColumnsItemWidth={180}
        gap={16}
        sizing={{ type: 'fixed', itemSize: 280 }}
        className="h-[500px] border bg-background"
      >
        {renderCardItem}
      </VirtualizedList>
    </div>
  ),
};

export const DynamicSizing: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Support for items with variable heights. Items are measured after render.',
      },
    },
  },
  render: () => (
    <VirtualizedList
      items={generateListItems(100)}
      getItemKey={(item) => item.id}
      layout="list"
      sizing={{ type: 'dynamic', estimateSize: 100 }}
      className="h-96 w-[500px] border bg-background"
    >
      {renderDynamicItem}
    </VirtualizedList>
  ),
};

export const SingleSelection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Single selection mode. Only one item can be selected at a time.',
      },
    },
  },
  render: function SingleSelectionStory() {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm">
          Selected: {selectedKeys.size > 0 ? [...selectedKeys].join(', ') : 'None'}
        </div>
        <VirtualizedList
          items={generateListItems(50)}
          getItemKey={(item) => item.id}
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          className="h-96 w-[500px] border bg-background"
          aria-label="Single selection list"
        >
          {renderListItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const MultipleSelection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Multiple selection mode. Use Ctrl+A to select all, Shift+Arrow for range selection.',
      },
    },
  },
  render: function MultipleSelectionStory() {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm">
          Selected: {selectedKeys.size} items
          {selectedKeys.size > 0 && selectedKeys.size <= 5 && (
            <span className="ml-2 opacity-70">
              ({[...selectedKeys].join(', ')})
            </span>
          )}
        </div>
        <VirtualizedList
          items={generateListItems(50)}
          getItemKey={(item) => item.id}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          className="h-96 w-[500px] border bg-background"
          aria-label="Multiple selection list"
        >
          {renderListItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const GridWithSelection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Grid layout with multiple selection. Arrow keys work in 2D.',
      },
    },
  },
  render: function GridSelectionStory() {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm">Selected: {selectedKeys.size} items</div>
        <VirtualizedList
          items={generateCardItems(50)}
          getItemKey={(item) => item.id}
          layout="grid"
          columns={4}
          gap={16}
          sizing={{ type: 'fixed', itemSize: 280 }}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          className="h-[500px] w-[700px] border bg-background"
          aria-label="Grid with selection"
        >
          {renderCardItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const AnimationModes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Different animation modes: staggered, fade, slide, scale, or none.',
      },
    },
  },
  render: function AnimationModesStory() {
    const [mode, setMode] = useState<AnimationMode>('staggered');
    const [key, setKey] = useState(0);

    const handleModeChange = (newMode: AnimationMode) => {
      setMode(newMode);
      setKey((k) => k + 1);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['staggered', 'fade', 'slide', 'scale', 'none'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={cn(
                'rounded px-3 py-1 text-sm',
                mode === m ? 'bg-accent text-accent-foreground' : 'bg-muted',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <VirtualizedList
          key={key}
          items={generateListItems(20)}
          getItemKey={(item) => item.id}
          animationMode={mode}
          className="h-96 w-[500px] border bg-background"
        >
          {renderListItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const CustomAnimation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use custom Framer Motion variants for complete control over animations.',
      },
    },
  },
  render: () => {
    const customVariants: Variants = {
      hidden: {
        opacity: 0,
        rotateX: -90,
        transformOrigin: 'top center',
      },
      visible: (index: number) => ({
        opacity: 1,
        rotateX: 0,
        transition: {
          delay: index * 0.05,
          duration: 0.4,
          ease: 'easeOut',
        },
      }),
      exit: {
        opacity: 0,
        rotateX: 90,
        transition: { duration: 0.2 },
      },
    };

    return (
      <VirtualizedList
        items={generateListItems(20)}
        getItemKey={(item) => item.id}
        animationMode="custom"
        customAnimationVariants={customVariants}
        className="h-96 w-[500px] border bg-background"
        style={{ perspective: 1000 }}
      >
        {renderListItem}
      </VirtualizedList>
    );
  },
};

export const LargeDataset: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates virtualization with 10,000 items. Performance remains smooth.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="text-sm opacity-70">10,000 items virtualized</div>
      <VirtualizedList
        items={generateListItems(10000)}
        getItemKey={(item) => item.id}
        sizing={{ type: 'fixed', itemSize: 80 }}
        animationMode="none"
        className="h-96 w-[500px] border bg-background"
      >
        {renderListItem}
      </VirtualizedList>
    </div>
  ),
};

export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: `Full keyboard navigation support:
- Arrow Up/Down: Navigate vertically
- Arrow Left/Right: Navigate horizontally (grid/horizontal)
- Home/End: Jump to first/last item
- Enter/Space: Select focused item
- Ctrl/Cmd + A: Select all (multiple mode)`,
      },
    },
  },
  render: function KeyboardNavigationStory() {
    const [focusedInfo, setFocusedInfo] = useState<string>('Click list to focus');

    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm opacity-70">{focusedInfo}</div>
        <VirtualizedList
          items={generateListItems(50)}
          getItemKey={(item) => item.id}
          selectionMode="multiple"
          onItemClick={(item, index) => setFocusedInfo(`Focused: ${item.title} (index ${index})`)}
          className="h-96 w-[500px] border bg-background"
          aria-label="Keyboard navigable list"
        >
          {renderListItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const AllLayoutsComparison: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three layout modes.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">List Layout</span>
        <VirtualizedList
          items={generateListItems(20)}
          getItemKey={(item) => item.id}
          layout="list"
          className="h-64 w-[400px] border bg-background"
        >
          {renderListItem}
        </VirtualizedList>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Grid Layout (3 columns)</span>
        <VirtualizedList
          items={generateCardItems(20)}
          getItemKey={(item) => item.id}
          layout="grid"
          columns={3}
          gap={12}
          sizing={{ type: 'fixed', itemSize: 240 }}
          className="h-[350px] w-[500px] border bg-background"
        >
          {renderCardItem}
        </VirtualizedList>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Horizontal Layout</span>
        <VirtualizedList
          items={generateListItems(20)}
          getItemKey={(item) => item.id}
          layout="horizontal"
          sizing={{ type: 'fixed', itemSize: 200 }}
          className="h-48 w-[500px] border bg-background"
        >
          {renderHorizontalItem}
        </VirtualizedList>
      </div>
    </div>
  ),
};

export const ControlledSelection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Fully controlled selection state with external buttons.',
      },
    },
  },
  render: function ControlledSelectionStory() {
    const items = generateListItems(20);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
      new Set(['item-0', 'item-2', 'item-4']),
    );

    const selectAll = () => {
      setSelectedKeys(new Set(items.map((item) => item.id)));
    };

    const clearSelection = () => {
      setSelectedKeys(new Set());
    };

    const selectEveryOther = () => {
      setSelectedKeys(
        new Set(items.filter((_, i) => i % 2 === 0).map((item) => item.id)),
      );
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button onClick={selectAll} className="rounded bg-muted px-3 py-1 text-sm">
            Select All
          </button>
          <button onClick={clearSelection} className="rounded bg-muted px-3 py-1 text-sm">
            Clear
          </button>
          <button onClick={selectEveryOther} className="rounded bg-muted px-3 py-1 text-sm">
            Every Other
          </button>
        </div>
        <div className="text-sm">Selected: {selectedKeys.size} items</div>
        <VirtualizedList
          items={items}
          getItemKey={(item) => item.id}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          className="h-96 w-[500px] border bg-background"
        >
          {renderListItem}
        </VirtualizedList>
      </div>
    );
  },
};

export const AccessibilityFeatures: Story = {
  parameters: {
    docs: {
      description: {
        story: `The VirtualizedList implements proper ARIA attributes:
- role="listbox" when selectable, role="list" otherwise
- aria-multiselectable for multiple selection
- aria-selected on selectable items
- aria-label support for screen readers`,
      },
    },
  },
  render: () => (
    <VirtualizedList
      items={generateListItems(20)}
      getItemKey={(item) => item.id}
      selectionMode="multiple"
      aria-label="Accessible virtualized list with multiple selection"
      className="h-96 w-[500px] border bg-background"
    >
      {renderListItem}
    </VirtualizedList>
  ),
};
