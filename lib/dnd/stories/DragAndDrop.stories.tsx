import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Heading from '~/components/typography/Heading';
import { Collection, InlineGridLayout, useDragAndDrop } from '~/lib/collection';
import { type DragMetadata, DndStoreProvider } from '~/lib/dnd';
import { Node } from '~/lib/ui/components';

type Item = {
  id: string;
  name: string;
  type: 'fruit' | 'vegetable' | 'protein';
};

const initialItems: Item[] = [
  { id: '1', name: 'Apple', type: 'fruit' },
  { id: '2', name: 'Banana', type: 'fruit' },
  { id: '3', name: 'Orange', type: 'fruit' },
  { id: '4', name: 'Carrot', type: 'vegetable' },
  { id: '5', name: 'Broccoli', type: 'vegetable' },
  { id: '6', name: 'Spinach', type: 'vegetable' },
  { id: '7', name: 'Chicken', type: 'protein' },
  { id: '8', name: 'Fish', type: 'protein' },
];

type ItemStore = Record<string, Item[]>;

function List({
  title,
  acceptTypes,
  items,
  onItemReceived,
  renderItem,
  className,
}: {
  title: string;
  acceptTypes: string[];
  items: Item[];
  onItemReceived: (metadata?: DragMetadata) => void;
  renderItem: (
    item: Item,
    itemProps: React.HTMLAttributes<HTMLElement>,
  ) => React.ReactNode;
  className?: string;
}) {
  const { dragAndDropHooks } = useDragAndDrop<Item>({
    getItems: () => [{ type: 'fruit', keys: new Set() }],
    acceptTypes,
    onDrop: (metadata) => {
      // eslint-disable-next-line no-console
      console.log('Dropped on', title, metadata);
      onItemReceived(metadata);
    },
  });

  return (
    <div className="bg-surface publish-colors text-surface-contrast flex flex-col gap-2 rounded border p-4 pb-8">
      <Heading level="h4">{title}</Heading>
      <Collection<Item>
        items={items}
        dragAndDropHooks={dragAndDropHooks}
        renderItem={renderItem}
        className={className}
        keyExtractor={(item) => item.id}
        layout={new InlineGridLayout()}
        animate
      />
    </div>
  );
}

const renderItem = (
  item: Item,
  itemProps: React.HTMLAttributes<HTMLElement>,
) => {
  const { onPointerDown, onPointerUp, ...restProps } = itemProps;
  return (
    <Node
      label={item.name}
      {...restProps}
      onPointerDown={onPointerDown as (e: React.PointerEvent) => void}
      onPointerUp={onPointerUp as (e: React.PointerEvent) => void}
      color={
        item.type === 'fruit'
          ? 'node-color-seq-1'
          : item.type === 'vegetable'
            ? 'node-color-seq-2'
            : 'node-color-seq-3'
      }
    />
  );
};

function DragDropExample() {
  // State to track items in different zones
  const [itemStore, setItemStore] = useState<ItemStore>({
    source: initialItems,
    fruits: [],
    vegetables: [],
    proteins: [],
    mixed: [],
    scrollable: [
      { id: 's1', name: 'Scrolled Apple', type: 'fruit' },
      {
        id: 's2',
        name: 'Scrolled Tomato',
        type: 'vegetable',
      },
    ],
  });

  const moveItem = (item: Item, fromZone: string, toZone: string) => {
    setItemStore((prev) => {
      const newStore = { ...prev };

      const sourceItems = newStore[fromZone] ?? [];
      newStore[fromZone] = sourceItems.filter((i) => i.id !== item.id);

      newStore[toZone] ??= [];
      const targetItems = newStore[toZone];
      newStore[toZone] = [...targetItems, item];

      return newStore;
    });
  };

  const handleItemReceived =
    (targetZone: string) => (metadata?: DragMetadata) => {
      if (!metadata) return;
      const itemId = metadata.id as string;
      const item = findItemById(itemId);

      const sourceZone = Object.keys(itemStore).find((zone) =>
        itemStore[zone]?.some((i) => i.id === itemId),
      );

      if (item && sourceZone && sourceZone !== targetZone) {
        moveItem(item, sourceZone, targetZone);
      }
    };

  const findItemById = (id: string): Item | null => {
    for (const items of Object.values(itemStore)) {
      const found = items.find((item) => item.id === id);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl p-5">
      <div className="laptop:grid-cols-[1fr_2fr] grid grid-cols-1 gap-5">
        <div className="flex flex-col gap-5">
          <List
            title="All Items (Source)"
            acceptTypes={['fruit', 'vegetable', 'protein']}
            items={itemStore.source ?? []}
            onItemReceived={handleItemReceived('source')}
            renderItem={renderItem}
            className="max-h-[400px]"
          />
          <List
            title="Scrollable Drop Zone"
            acceptTypes={['fruit', 'vegetable']}
            items={itemStore.scrollable ?? []}
            onItemReceived={handleItemReceived('scrollable')}
            renderItem={renderItem}
          />
        </div>
        <div>
          <div className="tablet:grid-cols-2 grid grid-cols-1 gap-4">
            <List
              title="Fruits Only"
              acceptTypes={['fruit']}
              items={itemStore.fruits ?? []}
              onItemReceived={handleItemReceived('fruits')}
              renderItem={renderItem}
            />
            <List
              title="Vegetables Only"
              acceptTypes={['vegetable']}
              items={itemStore.vegetables ?? []}
              onItemReceived={handleItemReceived('vegetables')}
              renderItem={renderItem}
            />
            <List
              title="Proteins Only"
              acceptTypes={['protein']}
              items={itemStore.proteins ?? []}
              onItemReceived={handleItemReceived('proteins')}
              renderItem={renderItem}
            />
            <List
              title="Mixed (All Types)"
              acceptTypes={['fruit', 'vegetable', 'protein']}
              items={itemStore.mixed ?? []}
              onItemReceived={handleItemReceived('mixed')}
              renderItem={renderItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Systems/DragAndDrop',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Drag and Drop System

A comprehensive drag and drop system with full accessibility support, type safety, and visual feedback.

## Features

- 🎯 **Type-safe drag operations** - Restrict which items can be dropped where
- ♿ **Full accessibility** - Keyboard navigation and screen reader support
- 🎨 **Custom drag previews** - Show custom UI while dragging
- 📱 **Touch support** - Works on mobile and desktop
- 🔄 **Auto-scroll** - Scroll containers automatically during drag
- 🎭 **Visual feedback** - Clear indication of valid/invalid drop zones

## Architecture

The system uses React Context (DndStoreProvider) to manage drag state globally, with two main hooks:

- \`useDragSource\` - Makes elements draggable
- \`useDropTarget\` - Creates drop zones

## Usage

\`\`\`tsx
// Wrap your app with the provider
<DndStoreProvider>
  <YourApp />
</DndStoreProvider>

// Make an element draggable
const { dragProps, isDragging } = useDragSource({
  type: 'item',
  metadata: { id: '1', name: 'Item 1' },
  announcedName: 'Item 1',
});

// Create a drop zone
const { dropProps, isOver, willAccept } = useDropTarget({
  id: 'drop-zone-1',
  accepts: ['item'],
  onDrop: (metadata) => console.log('Dropped:', metadata),
});
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DndStoreProvider>
        <Story />
      </DndStoreProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const MainExample: Story = {
  name: 'Complete Example',
  render: () => <DragDropExample />,
};
