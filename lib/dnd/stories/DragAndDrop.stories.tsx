import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { createContext, useCallback, useContext, useState } from 'react';
import { ScrollArea } from '~/components/ui/ScrollArea';
import {
  useDragSource,
  useDropTarget,
  useRovingTabIndex,
  type DragMetadata,
} from '~/lib/dnd';
import { Node } from '~/lib/ui/components';
import { cx } from '~/utils/cva';

// Context to pass roving tabindex props to draggable items
type RovingTabIndexContextValue = {
  getItemProps: (id: string) => {
    ref: (element: HTMLElement | null) => void;
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
  };
};

const RovingTabIndexContext = createContext<RovingTabIndexContextValue | null>(
  null,
);

type Item = {
  id: string;
  name: string;
  type: 'fruit' | 'vegetable' | 'protein';
};

const MotionNode = motion.create(Node);

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
  const rovingContext = useContext(RovingTabIndexContext);
  const rovingProps = rovingContext?.getItemProps(item.id);

  const { dragProps, isDragging } = useDragSource({
    type: item.type,
    metadata: {
      ...item,
    },
    announcedName: item.name,
    // preview:
    //   item.type === 'fruit' ? (
    //     <div className="bg-barbie-pink flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg">
    //       🍎 {item.name}
    //     </div>
    //   ) : undefined,
  });

  // Merge refs if roving tabindex is active
  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      dragProps.ref(element);
      rovingProps?.ref(element);
    },
    [dragProps, rovingProps],
  );

  // Merge keyboard handlers
  const mergedKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // When dragging, let drag system handle all keyboard events
      if (isDragging) {
        dragProps.onKeyDown(e);
        return;
      }

      // When not dragging, use roving tabindex for arrow navigation within zone
      if (rovingProps) {
        rovingProps.onKeyDown(e);
        if (e.defaultPrevented) return;
      }

      // Pass through to drag for Space/Enter to start drag
      dragProps.onKeyDown(e);
    },
    [dragProps, rovingProps, isDragging],
  );

  const itemVariants = {
    initial: { opacity: 0, y: '100%', scale: 0.8 },
    animate: { opacity: 1, y: '0%', scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
  };

  return (
    <MotionNode
      layout="position"
      variants={itemVariants}
      {...dragProps}
      ref={mergedRef}
      tabIndex={rovingProps?.tabIndex ?? dragProps.tabIndex}
      onKeyDown={mergedKeyDown}
      onFocus={rovingProps?.onFocus}
      label={item.name}
      color={
        item.type === 'fruit'
          ? 'node-color-seq-1'
          : item.type === 'vegetable'
            ? 'node-color-seq-2'
            : 'node-color-seq-3'
      }
    >
      {item.name}
    </MotionNode>
  );
}

type FocusBehaviorOnDrop = 'follow-item' | 'stay-in-source' | 'none';

function DropZone({
  title,
  acceptTypes,
  items,
  onItemReceived,
  children,
  className,
  focusBehaviorOnDrop,
}: {
  title: string;
  acceptTypes: string[];
  items: Item[];
  onItemReceived: (metadata?: DragMetadata) => void;
  children?: React.ReactNode;
  className?: string;
  focusBehaviorOnDrop?: FocusBehaviorOnDrop;
}) {
  const zoneId = `dropzone-${title.toLowerCase().replace(/\s+/g, '-')}`;

  // Set up roving tabindex for items in this zone
  // The hook automatically connects to the DnD store for focus coordination
  const itemIds = items.map((item) => item.id);
  const rovingTabIndex = useRovingTabIndex({ zoneId, itemIds });

  const { dropProps, willAccept, isOver, isDragging } = useDropTarget({
    id: zoneId,
    accepts: acceptTypes,
    announcedName: title,
    onDrop: onItemReceived,
    focusBehaviorOnDrop,
  });

  const groupVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        delayChildren: 0.2,
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0 },
  };

  return (
    <motion.div
      {...dropProps}
      className={cx(
        'flex flex-col',
        'bg-surface text-surface-contrast publish-colors min-h-[300px] rounded border-2 border-transparent p-5 transition-all duration-200',
        // Only show focus styles when drop zone is focusable (during dragging)
        isDragging && 'focusable',
        isDragging && willAccept && 'border-success',
        isDragging &&
          !willAccept &&
          'border-destructive bg-destructive/20 opacity-60',
        isDragging &&
          isOver &&
          willAccept &&
          'bg-success/20 ring-success ring-offset-background border-solid ring-2 ring-offset-2',
        className,
      )}
      variants={groupVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <h3 className="mt-0 mb-4">{title}</h3>
      <ScrollArea>
        {items.length === 0 && !children ? (
          <p className="my-10 text-center italic">
            Drop {acceptTypes.join(' or ')} items here
          </p>
        ) : (
          <AnimatePresence>
            <LayoutGroup id={zoneId}>
              <RovingTabIndexContext.Provider value={rovingTabIndex}>
                <div
                  className="flex flex-wrap gap-4"
                  role="listbox"
                  aria-label={`${title} items`}
                >
                  {items.map((item) => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                </div>
              </RovingTabIndexContext.Provider>
            </LayoutGroup>
          </AnimatePresence>
        )}
      </ScrollArea>
    </motion.div>
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
    <div className="mx-auto max-w-7xl p-5">
      <div className="laptop:grid-cols-[1fr_2fr] grid grid-cols-1 gap-5">
        <div className="flex flex-col gap-5">
          <DropZone
            title="All Items (Source)"
            acceptTypes={['fruit', 'vegetable', 'protein']}
            items={itemStore.source ?? []}
            onItemReceived={handleItemReceived('source')}
            className="max-h-[400px]"
          />
          <DropZone
            title="Scrollable Drop Zone"
            acceptTypes={['fruit', 'vegetable']}
            items={itemStore.scrollable ?? []}
            onItemReceived={handleItemReceived('scrollable')}
          />
        </div>
        <div>
          <div className="tablet:grid-cols-2 grid grid-cols-1 gap-4">
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
