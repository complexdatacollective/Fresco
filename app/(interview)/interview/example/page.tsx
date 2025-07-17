'use client';

import { useState } from 'react';
import { 
  useDragSource, 
  useDropTarget, 
  DragPreview,
  type DragMetadata 
} from '~/lib/dnd';

type Item = {
  id: string;
  name: string;
  color: string;
}

function DraggableItem({ item }: { item: Item }) {
  const { dragProps, isDragging } = useDragSource({
    metadata: { id: item.id, type: 'item', name: item.name },
    onDragStart: (meta) => console.log('Drag started:', meta),
    onDragEnd: (meta, dropTargetId) => console.log('Drag ended:', meta, 'on', dropTargetId),
  });

  return (
    <div
      {...dragProps}
      style={{
        ...dragProps.style,
        padding: '16px',
        margin: '8px',
        backgroundColor: item.color,
        color: 'white',
        borderRadius: '8px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {item.name}
    </div>
  );
}

function DropZone({ 
  title, 
  acceptTypes,
  onItemDropped 
}: { 
  title: string;
  acceptTypes: string[];
  onItemDropped: (metadata: DragMetadata) => void;
}) {
  const [items, setItems] = useState<string[]>([]);
  
  const { dropProps, isOver, canDrop, dragItem } = useDropTarget({
    accepts: (metadata) => acceptTypes.includes(metadata.type as string),
    onDrop: (metadata) => {
      setItems(prev => [...prev, metadata.name as string]);
      onItemDropped(metadata);
    },
    onDragEnter: (metadata) => console.log('Drag entered:', title, metadata),
    onDragLeave: (metadata) => console.log('Drag left:', title, metadata),
  });

  return (
    <div
      {...dropProps}
      style={{
        ...dropProps.style,
        minHeight: '200px',
        padding: '20px',
        margin: '10px',
        backgroundColor: isOver && canDrop ? '#e6f3ff' : '#f5f5f5',
        border: `2px dashed ${canDrop ? '#4299e1' : '#ccc'}`,
        borderRadius: '8px',
        transition: 'all 0.2s',
      }}
    >
      <h3>{title}</h3>
      {isOver && canDrop && (
        <p style={{ color: '#4299e1' }}>Drop here!</p>
      )}
      {items.length === 0 ? (
        <p style={{ color: '#999' }}>Drop items here</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      {dragItem && (
        <p style={{ fontSize: '12px', color: '#666' }}>
          Currently dragging: {dragItem.metadata.name as string}
        </p>
      )}
    </div>
  );
}

function ScrollableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '300px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        margin: '10px 0',
      }}
    >
      <h3>Scrollable Container</h3>
      <p>This demonstrates dragging from/to scrollable containers</p>
      {children}
    </div>
  );
}

export default function DragDropExample() {
  const items: Item[] = [
    { id: '1', name: 'Red Item', color: '#e53e3e' },
    { id: '2', name: 'Blue Item', color: '#3182ce' },
    { id: '3', name: 'Green Item', color: '#38a169' },
    { id: '4', name: 'Purple Item', color: '#805ad5' },
    { id: '5', name: 'Orange Item', color: '#dd6b20' },
  ];

  const [droppedItems, setDroppedItems] = useState<Record<string, number>>({});

  const handleItemDropped = (metadata: DragMetadata) => {
    const itemId = metadata.id as string;
    setDroppedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Drag and Drop Example</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>Instructions</h2>
        <ul>
          <li>Drag items from the source area to any drop zone</li>
          <li>Different drop zones accept different types of items</li>
          <li>Items can be dragged from scrollable containers</li>
          <li>Press Tab to navigate, Space/Enter to drag with keyboard</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div>
          <h2>Draggable Items</h2>
          <div style={{ backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '8px' }}>
            {items.map(item => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </div>

          <ScrollableContainer>
            <p>Items in scrollable area:</p>
            {items.map(item => (
              <DraggableItem key={`scroll-${item.id}`} item={{ ...item, id: `scroll-${item.id}` }} />
            ))}
            <div style={{ height: '200px' }} />
          </ScrollableContainer>
        </div>

        <div>
          <h2>Drop Zones</h2>
          <DropZone 
            title="Accepts All Items" 
            acceptTypes={['item']}
            onItemDropped={handleItemDropped}
          />
          
          <DropZone 
            title="Accepts Only Red and Blue" 
            acceptTypes={['item']}
            onItemDropped={(metadata) => {
              const name = metadata.name as string;
              if (name.includes('Red') || name.includes('Blue')) {
                handleItemDropped(metadata);
              }
            }}
          />

          <ScrollableContainer>
            <DropZone 
              title="Drop Zone in Scrollable Area" 
              acceptTypes={['item']}
              onItemDropped={handleItemDropped}
            />
            <div style={{ height: '200px' }} />
          </ScrollableContainer>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Statistics</h2>
        <pre>{JSON.stringify(droppedItems, null, 2)}</pre>
      </div>

      <DragPreview>
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#4299e1',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transform: 'rotate(-5deg)',
          }}
        >
          Dragging...
        </div>
      </DragPreview>
    </div>
  );
}