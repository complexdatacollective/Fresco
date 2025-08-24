import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { DndStoreProvider, useDragSource, useDropTarget } from '..';

// Simple draggable item component
function DraggableItem({
  id,
  type,
  children,
  preview,
  style = {},
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { dragProps, isDragging } = useDragSource({
    type,
    metadata: { type, id },
    preview,
    announcedName: `${type} item ${id}`,
  });

  return (
    <div
      {...dragProps}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
        border: '2px solid #ddd',
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Simple drop zone
function DropZone({
  accepts,
  children,
  onDrop,
}: {
  accepts: string[];
  children: React.ReactNode;
  onDrop?: (metadata: any) => void;
}) {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `drop-zone-${Math.random().toString(36).substr(2, 9)}`,
    accepts,
    onDrop,
  });

  return (
    <div
      {...dropProps}
      style={{
        padding: '24px',
        margin: '8px',
        border: '3px dashed',
        borderColor: isOver && willAccept ? '#4caf50' : '#ccc',
        borderRadius: '12px',
        backgroundColor: isOver && willAccept ? '#e8f5e9' : '#fafafa',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Systems/DragAndDrop/DragSource',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`useDragSource\` hook makes elements draggable. It handles mouse, touch, and keyboard interactions.

## Basic Usage
\`\`\`tsx
const { dragProps, isDragging } = useDragSource({
  type: 'item',
  metadata: { id: '1', type: 'item' },
  announcedName: 'Item 1',
});

return <div {...dragProps}>Draggable Item</div>;
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
        <h3>Basic Draggable Items</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div>
            <DraggableItem id="1" type="card">
              Card Item
            </DraggableItem>
            <DraggableItem id="2" type="card">
              Another Card
            </DraggableItem>
          </div>
          <DropZone accepts={['card']}>Drop cards here</DropZone>
        </div>
      </div>
    </DndStoreProvider>
  ),
};

export const WithPreview: Story = {
  render: () => (
    <DndStoreProvider>
      <div style={{ padding: '20px' }}>
        <h3>Custom Preview</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div>
            <DraggableItem
              id="custom-1"
              type="fancy"
              preview={
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#9c27b0',
                    color: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    transform: 'rotate(-3deg)',
                  }}
                >
                  🎯 Custom Preview
                </div>
              }
            >
              Item with Custom Preview
            </DraggableItem>
            <DraggableItem id="default-1" type="regular">
              Default Preview
            </DraggableItem>
          </div>
          <DropZone accepts={['fancy', 'regular']}>Drop items here</DropZone>
        </div>
      </div>
    </DndStoreProvider>
  ),
};

export const TypeRestrictions: Story = {
  render: () => {
    const [lastDrop, setLastDrop] = useState<string>('');

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h3>Type Restrictions</h3>
          {lastDrop && (
            <div
              style={{
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              Last dropped: {lastDrop}
            </div>
          )}
          <div
            style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}
          >
            <div>
              <h4>Items</h4>
              <DraggableItem
                id="fruit-1"
                type="fruit"
                style={{ backgroundColor: '#ffcdd2' }}
              >
                🍎 Apple
              </DraggableItem>
              <DraggableItem
                id="veggie-1"
                type="vegetable"
                style={{ backgroundColor: '#c8e6c9' }}
              >
                🥕 Carrot
              </DraggableItem>
              <DraggableItem
                id="protein-1"
                type="protein"
                style={{ backgroundColor: '#d1c4e9' }}
              >
                🍖 Meat
              </DraggableItem>
            </div>
            <div>
              <h4>Drop Zones</h4>
              <DropZone
                accepts={['fruit']}
                onDrop={(metadata) => setLastDrop(`Fruit: ${metadata.id}`)}
              >
                Fruits Only
              </DropZone>
              <DropZone
                accepts={['vegetable']}
                onDrop={(metadata) => setLastDrop(`Vegetable: ${metadata.id}`)}
              >
                Vegetables Only
              </DropZone>
              <DropZone
                accepts={['fruit', 'vegetable', 'protein']}
                onDrop={(metadata) => setLastDrop(`Any: ${metadata.id}`)}
              >
                All Types
              </DropZone>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};
