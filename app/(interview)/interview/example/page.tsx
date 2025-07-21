'use client';

import { useState } from 'react';
import {
  DragPreview,
  useDragSource,
  useDropTarget,
  type DragMetadata,
} from '~/lib/dnd';
import { cn } from '~/utils/shadcn';

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

function DraggableItem({
  item,
  sourceZone,
}: {
  item: Item;
  sourceZone: string;
}) {
  const { dragProps, isDragging } = useDragSource({
    metadata: {
      id: item.id,
      type: item.type,
      sourceZone,
    },
    name: item.name, // For screen reader announcements
    // Custom preview for fruits
    preview: item.type === 'fruit' ? (
      <div className="bg-barbie-pink text-white rounded-full h-20 w-20 flex items-center justify-center shadow-lg">
        🍎 {item.name}
      </div>
    ) : undefined, // Use default (cloned element) for other types
    onDragStart: (meta) => {
      // Drag started
      void meta;
    },
    onDragEnd: (meta, dropTargetId) => {
      // Drag ended - no action needed here as onDrop handles the move
      void meta;
      void dropTargetId;
    },
  });

  return (
    <div
      {...dragProps}
      className={cn(
        'm-2 rounded-lg px-4 py-3 text-white transition-opacity duration-200 select-none',
        'focus:ring-accent focus:ring-offset-background focus:ring-2 focus:ring-offset-2 focus:outline-none',
        item.type === 'fruit' && 'bg-barbie-pink',
        item.type === 'vegetable' && 'bg-kiwi',
        item.type === 'protein' && 'bg-charcoal',
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
  zoneId,
  children,
}: {
  title: string;
  acceptTypes: string[];
  items: Item[];
  onItemReceived: (metadata: DragMetadata) => void;
  zoneId: string;
  children?: React.ReactNode;
}) {
  const { dropProps, willAccept, isOver, isDragging } = useDropTarget({
    accepts: acceptTypes,
    zoneId,
    name: title, // For screen reader announcements
    onDrop: (metadata) => {
      onItemReceived(metadata);
    },
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
      className={cn(
        'bg-cyber-grape/50 min-h-[300px] rounded-lg border-2 border-dashed border-transparent p-5 transition-all duration-200',
        // Only show focus styles when drop zone is focusable (during dragging)
        isDragging &&
          'focus:ring-accent focus:ring-offset-background focus:ring-2 focus:ring-offset-2 focus:outline-none',
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
        <p className="text-muted-foreground my-10 text-center italic">
          Drop {acceptTypes.join(' or ')} items here
        </p>
      ) : (
        <>
          {children}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} sourceZone={zoneId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScrollableContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-panel h-96 overflow-y-auto rounded-lg border p-4">
      <h3 className="text-foreground mt-0">Scrollable Container</h3>
      <p className="text-muted-foreground">
        This demonstrates dragging from/to scrollable containers
      </p>
      {children}
      <div className="h-48" />
      <p className="text-muted-foreground text-sm">
        Scroll content to test auto-scroll during drag
      </p>
    </div>
  );
}

export default function DragDropExample() {
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

  const handleItemReceived = (metadata: DragMetadata, targetZone: string) => {
    const item = findItemById(metadata.id as string);
    const sourceZone = metadata.sourceZone as string;

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
    <div className="mx-auto max-w-7xl p-5 text-white">
      <div className="bg-cyber-grape mb-8 rounded-lg p-4">
        <h2 className="mt-0">Instructions</h2>
        <ul className="m-0">
          <li>
            <strong>Mouse/Touch:</strong> Drag items between zones
          </li>
          <li>
            <strong>Keyboard:</strong> Tab to focus items, Space/Enter to start
            drag, Arrow keys to navigate drop zones, Space/Enter to drop, Escape
            to cancel
          </li>
          <li>
            <strong>Visual Feedback:</strong> Success borders = valid drop
            zones, Destructive borders = invalid zones
          </li>
          <li>
            <strong>Type Restrictions:</strong> Each zone accepts specific item
            types
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-5">
          <DropZone
            title="All Items (Source)"
            acceptTypes={['fruit', 'vegetable', 'protein']}
            items={itemStore.source ?? []}
            onItemReceived={(meta) => handleItemReceived(meta, 'source')}
            zoneId="source"
          />
          <ScrollableContainer>
            <DropZone
              title="Scrollable Drop Zone"
              acceptTypes={['fruit', 'vegetable']}
              items={itemStore.scrollable ?? []}
              onItemReceived={(meta) => handleItemReceived(meta, 'scrollable')}
              zoneId="scrollable"
            />
          </ScrollableContainer>
        </div>
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DropZone
              title="Fruits Only"
              acceptTypes={['fruit']}
              items={itemStore.fruits ?? []}
              onItemReceived={(meta) => handleItemReceived(meta, 'fruits')}
              zoneId="fruits"
            />
            <DropZone
              title="Vegetables Only"
              acceptTypes={['vegetable']}
              items={itemStore.vegetables ?? []}
              onItemReceived={(meta) => handleItemReceived(meta, 'vegetables')}
              zoneId="vegetables"
            />
            <DropZone
              title="Proteins Only"
              acceptTypes={['protein']}
              items={itemStore.proteins ?? []}
              onItemReceived={(meta) => handleItemReceived(meta, 'proteins')}
              zoneId="proteins"
            />
            <DropZone
              title="Mixed (All Types)"
              acceptTypes={['fruit', 'vegetable', 'protein']}
              items={itemStore.mixed ?? []}
              onItemReceived={(meta) => handleItemReceived(meta, 'mixed')}
              zoneId="mixed"
            />
          </div>
        </div>
      </div>
      <DragPreview />
    </div>
  );
}
