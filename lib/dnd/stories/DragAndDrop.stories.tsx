import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  DndStoreProvider,
  useDragSource,
  useDropTarget,
  type DragMetadata,
} from '~/lib/dnd';
import { cx } from '~/utils/cva';

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

function DraggableItem({ item }: { item: Item }) {
  const { dragProps, isDragging } = useDragSource({
    type: item.type,
    metadata: {
      ...item,
    },
    announcedName: item.name, // For screen reader announcements
    // Custom preview for fruits
    preview:
      item.type === 'fruit' ? (
        <div className="bg-barbie-pink flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg">
          🍎 {item.name}
        </div>
      ) : undefined, // Use default (cloned element) for other types
  });

  return (
    <div
      {...dragProps}
      className={cx(
        'm-2 rounded-lg px-4 py-3 text-white transition-opacity duration-200 select-none',
        'focusable',
        item.type === 'fruit' && 'bg-barbie-pink',
        item.type === 'vegetable' && 'bg-kiwi',
        item.type === 'protein' && 'bg-charcoal',
        isDragging &&
          'opacity-75 ring-2 ring-white ring-offset-2 ring-offset-transparent',
      )}
    >
      {item.name}
    </div>
  );
}

function DropZone({
  title,
  acceptTypes,
  items,
  onItemReceived,
  children,
}: {
  title: string;
  acceptTypes: string[];
  items: Item[];
  onItemReceived: (metadata?: DragMetadata) => void;
  children?: React.ReactNode;
}) {
  const { dropProps, willAccept, isOver, isDragging } = useDropTarget({
    id: `dropzone-${title.toLowerCase().replace(/\s+/g, '-')}`,
    accepts: acceptTypes,
    announcedName: title, // For screen reader announcements
    onDrop: onItemReceived,
    onDragEnter: () => {
      // Drag entered
    },
    onDragLeave: () => {
      // Drag left
    },
  });

  return (
    <div
      {...dropProps}
      className={cx(
        'bg-cyber-grape/50 min-h-[300px] rounded-lg border-2 border-dashed border-transparent p-5 transition-all duration-200',
        // Only show focus styles when drop zone is focusable (during dragging)
        isDragging && 'focusable',
        isDragging && willAccept && 'border-success bg-cyber-grape',
        isDragging &&
          !willAccept &&
          'border-destructive bg-destructive/20 opacity-60',
        isDragging &&
          isOver &&
          willAccept &&
          'bg-success/20 ring-success ring-offset-background border-solid ring-2 ring-offset-2',
      )}
    >
      <h3 className="mt-0 mb-4 text-white">{title}</h3>
      {items.length === 0 && !children ? (
        <p className="my-10 text-center text-white/40 italic">
          Drop {acceptTypes.join(' or ')} items here
        </p>
      ) : (
        <>
          {children}
          <div className="flex flex-col flex-wrap">
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScrollableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cyber-grape h-96 overflow-y-auto rounded-lg border p-4 text-white">
      <h3 className="mt-0">Scrollable Container</h3>
      <p className="text-white/50">
        This demonstrates dragging from/to scrollable containers
      </p>
      {children}
      <div className="h-48" />
      <p className="text-sm text-white/50">
        Scroll content to test auto-scroll during drag
      </p>
    </div>
  );
}

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

      // Remove from source zone
      const sourceItems = newStore[fromZone] ?? [];
      newStore[fromZone] = sourceItems.filter((i) => i.id !== item.id);

      // Add to target zone
      newStore[toZone] ??= [];
      const targetItems = newStore[toZone];
      newStore[toZone] = [...targetItems, item];

      return newStore;
    });
  };

  const handleItemReceived =
    (targetZone: string) => (metadata?: DragMetadata) => {
      if (!metadata) return;
      const item = findItemById(metadata.id as string);

      // Find source zone by id
      const sourceZone = Object.keys(itemStore).find((zone) =>
        itemStore[zone]?.some((i) => i.id === metadata.id),
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
    <DndStoreProvider>
      <div className="bg-navy-taupe mx-auto max-w-7xl p-5 text-white">
        <div className="bg-cyber-grape mb-8 rounded-lg p-4">
          <h2 className="mt-0">Instructions</h2>
          <ul className="m-0">
            <li>
              <strong>Mouse/Touch:</strong> Drag items between zones
            </li>
            <li>
              <strong>Keyboard:</strong> Tab to focus items, Space/Enter to
              start drag, Arrow keys to navigate drop zones, Space/Enter to
              drop, Escape to cancel
            </li>
            <li>
              <strong>Visual Feedback:</strong> Success borders = valid drop
              zones, Destructive borders = invalid zones
            </li>
            <li>
              <strong>Type Restrictions:</strong> Each zone accepts specific
              item types
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-5">
            <DropZone
              title="All Items (Source)"
              acceptTypes={['fruit', 'vegetable', 'protein']}
              items={itemStore.source ?? []}
              onItemReceived={handleItemReceived('source')}
            />
            <ScrollableContainer>
              <DropZone
                title="Scrollable Drop Zone"
                acceptTypes={['fruit', 'vegetable']}
                items={itemStore.scrollable ?? []}
                onItemReceived={handleItemReceived('scrollable')}
              />
            </ScrollableContainer>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DropZone
                title="Fruits Only"
                acceptTypes={['fruit']}
                items={itemStore.fruits ?? []}
                onItemReceived={handleItemReceived('fruits')}
              />
              <DropZone
                title="Vegetables Only"
                acceptTypes={['vegetable']}
                items={itemStore.vegetables ?? []}
                onItemReceived={handleItemReceived('vegetables')}
              />
              <DropZone
                title="Proteins Only"
                acceptTypes={['protein']}
                items={itemStore.proteins ?? []}
                onItemReceived={handleItemReceived('proteins')}
              />
              <DropZone
                title="Mixed (All Types)"
                acceptTypes={['fruit', 'vegetable', 'protein']}
                items={itemStore.mixed ?? []}
                onItemReceived={handleItemReceived('mixed')}
              />
            </div>
          </div>
        </div>
      </div>
    </DndStoreProvider>
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
};

export default meta;
type Story = StoryObj;

export const MainExample: Story = {
  name: 'Complete Example',
  render: () => <DragDropExample />,
};
