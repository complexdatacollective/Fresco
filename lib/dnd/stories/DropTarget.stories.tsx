import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  DndStoreProvider,
  useDragSource,
  useDropTarget,
  type DragMetadata,
} from '..';

// Simple drag source for testing
function DraggableItem({
  id,
  type,
  children,
  style = {},
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { dragProps, isDragging } = useDragSource({
    type,
    metadata: { type, id },
    announcedName: `${type} ${id}`,
  });

  return (
    <div
      {...dragProps}
      style={{
        padding: '12px 16px',
        margin: '4px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        backgroundColor: isDragging ? '#e3f2fd' : '#f8f9fa',
        cursor: 'grab',
        display: 'inline-block',
        fontSize: '14px',
        opacity: isDragging ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Configurable drop target component
function DropTargetExample({
  accepts,
  name,
  onDrop,
  onDragEnter,
  onDragLeave,
  children,
  style = {},
  minHeight = 100,
}: {
  accepts: string[];
  name?: string;
  onDrop?: (metadata?: DragMetadata) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  minHeight?: number;
}) {
  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: `drop-${Math.random().toString(36).slice(2, 11)}`,
    accepts,
    announcedName: name ?? 'Drop Target',
    onDrop,
    onDragEnter,
    onDragLeave,
  });

  return (
    <div
      {...dropProps}
      style={{
        padding: '20px',
        margin: '8px',
        border: '2px dashed',
        borderRadius: '8px',
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        borderColor:
          isDragging && willAccept
            ? isOver
              ? '#4caf50'
              : '#2196f3'
            : isDragging
              ? '#f44336'
              : '#ccc',
        backgroundColor:
          isDragging && willAccept
            ? isOver
              ? '#e8f5e9'
              : '#e3f2fd'
            : isDragging
              ? '#ffebee'
              : '#fafafa',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Systems/DragAndDrop/DropTarget',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`useDropTarget\` hook creates drop zones that can receive draggable items. It provides visual feedback during drag operations.

## Basic Usage
\`\`\`tsx
const { dropProps, isOver, willAccept } = useDropTarget({
  id: 'my-drop-zone',
  accepts: ['item'],
  onDrop: (metadata) => console.log('Dropped:', metadata),
});

return <div {...dropProps}>Drop Zone</div>;
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <DndStoreProvider>
      <div style={{ padding: '20px' }}>
        <h3>Basic Drop Target</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div>
            <h4>Draggable Items</h4>
            <DraggableItem id="item1" type="document">
              📄 Document
            </DraggableItem>
            <DraggableItem id="item2" type="document">
              📋 Report
            </DraggableItem>
          </div>
          <div style={{ flex: 1 }}>
            <h4>Drop Zone</h4>
            <DropTargetExample accepts={['document']}>
              Drop documents here
            </DropTargetExample>
          </div>
        </div>
      </div>
    </DndStoreProvider>
  ),
};

export const MultipleTypes: Story = {
  render: () => {
    const [dropLog, setDropLog] = useState<string[]>([]);

    const handleDrop = (zone: string) => (metadata?: DragMetadata) => {
      const type =
        typeof metadata?.type === 'string' ? metadata.type : 'unknown';
      const message = `${type} dropped in ${zone}`;
      setDropLog((prev) => [...prev.slice(-4), message]);
    };

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h3>Multiple Drop Zones</h3>

          {dropLog.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4>Drop Log:</h4>
              <ul style={{ fontSize: '14px', color: '#666' }}>
                {dropLog.map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <h4>Items</h4>
              <DraggableItem
                id="img1"
                type="image"
                style={{ backgroundColor: '#ffcdd2' }}
              >
                🖼️ Image
              </DraggableItem>
              <DraggableItem
                id="vid1"
                type="video"
                style={{ backgroundColor: '#c8e6c9' }}
              >
                🎥 Video
              </DraggableItem>
              <DraggableItem
                id="doc1"
                type="document"
                style={{ backgroundColor: '#d1c4e9' }}
              >
                📄 Document
              </DraggableItem>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <h4>Images Only</h4>
                  <DropTargetExample
                    accepts={['image']}
                    onDrop={handleDrop('Images Folder')}
                  >
                    Images Only
                  </DropTargetExample>
                </div>
                <div>
                  <h4>Videos Only</h4>
                  <DropTargetExample
                    accepts={['video']}
                    onDrop={handleDrop('Videos Folder')}
                  >
                    Videos Only
                  </DropTargetExample>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <h4>All Files</h4>
                  <DropTargetExample
                    accepts={['image', 'video', 'document']}
                    onDrop={handleDrop('All Files Folder')}
                  >
                    Any File Type
                  </DropTargetExample>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};

export const VisualFeedback: Story = {
  render: () => {
    const [eventLog, setEventLog] = useState<string[]>([]);

    const logEvent = (event: string, zone: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEventLog((prev) => [
        ...prev.slice(-5),
        `${timestamp}: ${event} (${zone})`,
      ]);
    };

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h3>Visual Feedback States</h3>

          <div style={{ marginBottom: '16px' }}>
            <h4>Event Log:</h4>
            <div
              style={{
                height: '100px',
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              {eventLog.length === 0 ? (
                <div style={{ color: '#999' }}>
                  Start dragging to see events...
                </div>
              ) : (
                eventLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
            <button
              onClick={() => setEventLog([])}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear Log
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <DraggableItem id="test1" type="test">
                Test Item
              </DraggableItem>
            </div>

            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <DropTargetExample
                accepts={['test']}
                name="Zone A"
                onDrop={() => logEvent('DROP', 'Zone A')}
                onDragEnter={() => logEvent('ENTER', 'Zone A')}
                onDragLeave={() => logEvent('LEAVE', 'Zone A')}
              >
                Zone A (Accepts test)
              </DropTargetExample>

              <DropTargetExample
                accepts={['other']}
                name="Zone B"
                onDragEnter={() => logEvent('ENTER', 'Zone B')}
                onDragLeave={() => logEvent('LEAVE', 'Zone B')}
              >
                Zone B (Rejects test)
              </DropTargetExample>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
            <strong>Visual States:</strong>
            <ul>
              <li>
                <strong>Blue border:</strong> Will accept the dragged item
              </li>
              <li>
                <strong>Green border:</strong> Item is over and will accept
              </li>
              <li>
                <strong>Red border:</strong> Will not accept the dragged item
              </li>
            </ul>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};

export const NestedDropTargets: Story = {
  render: () => {
    const [drops, setDrops] = useState<{ zone: string; item: string }[]>([]);

    const handleDrop = (zoneName: string) => (metadata?: DragMetadata) => {
      const id = typeof metadata?.id === 'string' ? metadata.id : 'unknown';
      setDrops((prev) => [...prev, { zone: zoneName, item: id }]);
    };

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h3>Nested Drop Targets</h3>

          {drops.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong>Drops:</strong>{' '}
              {drops.map((d) => `${d.item} → ${d.zone}`).join(', ')}
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <DraggableItem id="nested1" type="item">
                Draggable Item
              </DraggableItem>
            </div>

            <div style={{ flex: 1 }}>
              <DropTargetExample
                accepts={['item']}
                name="Outer Container"
                onDrop={handleDrop('Outer')}
                style={{ padding: '40px', backgroundColor: '#e8f5e9' }}
                minHeight={200}
              >
                <div>Outer Drop Zone</div>
                <DropTargetExample
                  accepts={['item']}
                  name="Inner Container"
                  onDrop={handleDrop('Inner')}
                  style={{
                    backgroundColor: '#fff3e0',
                    margin: '16px 0',
                  }}
                  minHeight={80}
                >
                  Inner Drop Zone
                </DropTargetExample>
              </DropTargetExample>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};
