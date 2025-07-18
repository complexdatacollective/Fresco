'use client';

import { useState } from 'react';
import {
  DragPreview,
  useDragSource,
  useDropTarget,
  type DragMetadata
} from '~/lib/dnd';
import { cn } from '~/utils/shadcn';

type Item = {
  id: string;
  name: string;
  color: string;
  type: string;
}

type ItemStore = Record<string, Item[]>

function DraggableItem({ item, sourceZone }: { 
  item: Item; 
  sourceZone: string;
}) {
  const { dragProps, isDragging } = useDragSource({
    metadata: { 
      id: item.id, 
      type: item.type, 
      name: item.name,
      sourceZone 
    },
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
        'px-4 py-3 m-2 rounded-lg transition-opacity duration-200 text-white select-none',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background'
      )}
      style={{
        ...dragProps.style,
        backgroundColor: item.color,
        opacity: isDragging ? 0.5 : 1,
      }}
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
  children
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
        'min-h-[300px] p-5 m-2.5 rounded-lg transition-all duration-200 bg-cyber-grape/50 border-2 border-transparent border-dashed',
        // Only show focus styles when drop zone is focusable (during dragging)
        isDragging && 'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
        isDragging && willAccept && 'border-success bg-cyber-grape',
        isDragging && !willAccept && 'border-destructive bg-destructive/20 opacity-60',
        isDragging && isOver && willAccept && 'border-solid bg-success/20 ring-2 ring-success ring-offset-2 ring-offset-background'
      )}
      style={{
        ...dropProps.style,
      }}
    >
      <h3 className="mt-0 mb-4 text-white">{title}</h3>
      {items.length === 0 && !children ? (
        <p className="text-muted-foreground italic text-center my-10">
          Drop {acceptTypes.join(' or ')} items here
        </p>
      ) : (
        <>
          {children}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => (
              <DraggableItem 
                key={item.id} 
                item={item} 
                sourceZone={zoneId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScrollableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-96 overflow-y-auto border border-border rounded-lg p-4 my-4 bg-panel">
      <h3 className="mt-0 text-foreground">Scrollable Container</h3>
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
  const initialItems: Item[] = [
    { id: '1', name: 'Apple', color: '#ef4444', type: 'fruit' },
    { id: '2', name: 'Banana', color: '#fbbf24', type: 'fruit' },
    { id: '3', name: 'Orange', color: '#f97316', type: 'fruit' },
    { id: '4', name: 'Carrot', color: '#f97316', type: 'vegetable' },
    { id: '5', name: 'Broccoli', color: '#22c55e', type: 'vegetable' },
    { id: '6', name: 'Spinach', color: '#16a34a', type: 'vegetable' },
    { id: '7', name: 'Chicken', color: '#a855f7', type: 'protein' },
    { id: '8', name: 'Fish', color: '#3b82f6', type: 'protein' },
  ];

  // State to track items in different zones
  const [itemStore, setItemStore] = useState<ItemStore>({
    source: initialItems,
    fruits: [],
    vegetables: [],
    proteins: [],
    mixed: [],
    scrollable: [
      { id: 's1', name: 'Scrolled Apple', color: '#dc2626', type: 'fruit' },
      { id: 's2', name: 'Scrolled Tomato', color: '#ea580c', type: 'vegetable' },
    ]
  });

  const moveItem = (item: Item, fromZone: string, toZone: string) => {
    setItemStore(prev => {
      const newStore = { ...prev };
      
      // Remove from source zone
      const sourceItems = newStore[fromZone] ?? [];
      newStore[fromZone] = sourceItems.filter(i => i.id !== item.id);
      
      // Add to target zone
      newStore[toZone] ??= [];
      const targetItems = newStore[toZone];
      newStore[toZone] = [...targetItems, item];
      
      return newStore;
    });
  };

  // handleItemMove is no longer needed - drops are handled by onDrop callback

  const handleItemReceived = (metadata: DragMetadata, targetZone: string) => {
    const item = findItemById(metadata.id as string);
    const sourceZone = metadata.sourceZone as string;
    
    if (item && sourceZone && sourceZone !== targetZone) {
      moveItem(item, sourceZone, targetZone);
    }
  };

  const findItemById = (id: string): Item | null => {
    for (const items of Object.values(itemStore)) {
      const found = items.find(item => item.id === id);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="p-5 max-w-7xl mx-auto text-white">
      <div className="mb-8 p-4 bg-cyber-grape rounded-lg">
        <h2 className="mt-0">Instructions</h2>
        <ul className="m-0">
          <li><strong>Mouse/Touch:</strong> Drag items between zones</li>
          <li><strong>Keyboard:</strong> Tab to focus items, Space/Enter to start drag, Arrow keys to navigate drop zones, Space/Enter to drop, Escape to cancel</li>
          <li><strong>Visual Feedback:</strong> Success borders = valid drop zones, Destructive borders = invalid zones</li>
          <li><strong>Type Restrictions:</strong> Each zone accepts specific item types</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">
        {/* Source Area */}
        <div>
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

        {/* Drop Zones */}
        <div>          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <DragPreview>
        <div className="px-4 py-2 bg-accent text-accent-foreground rounded-md shadow-lg rotate-[-2deg] text-sm font-bold">
          📦 Dragging...
        </div>
      </DragPreview>
    </div>
  );
}