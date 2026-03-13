import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useDragSource, useDropTarget, type DragMetadata } from '..';

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

// Draggable item with click handler (tests click vs drag threshold)
function ClickableDraggableItem({
  id,
  type,
  children,
  onClick,
  isSelected,
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}) {
  const { dragProps, isDragging } = useDragSource({
    type,
    metadata: { type, id },
    announcedName: `${type} item ${id}`,
  });

  return (
    <div
      {...dragProps}
      onClick={onClick}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: isSelected
          ? '#bbdefb'
          : isDragging
            ? '#e3f2fd'
            : '#f5f5f5',
        border: isSelected ? '2px solid #1976d2' : '2px solid #ddd',
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {children}
      {isSelected && <span style={{ marginLeft: '8px' }}>✓</span>}
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
  onDrop?: (metadata?: DragMetadata) => void;
}) {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `drop-zone-${Math.random().toString(36).slice(2, 11)}`,
    accepts,
    announcedName: 'Drop zone',
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
    <>
      <div style={{ padding: '20px' }}>
        <Heading level="h3" margin="none">
          Basic Draggable Items
        </Heading>
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
    </>
  ),
};

export const WithPreview: Story = {
  render: () => (
    <>
      <div style={{ padding: '20px' }}>
        <Heading level="h3" margin="none">
          Custom Preview
        </Heading>
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
    </>
  ),
};

export const ClickAndDrag: Story = {
  render: () => {
    const [clickedItem, setClickedItem] = useState<string | null>(null);
    const [dropCount, setDropCount] = useState(0);

    return (
      <>
        <div style={{ padding: '20px' }}>
          <Heading level="h3" margin="none">
            Click vs Drag Behavior
          </Heading>
          <Paragraph margin="none" className="mb-4 text-[#666]">
            <strong>Mouse/Touch:</strong> Click to select (opens form in real
            usage), drag to move. Threshold is 4px.
            <br />
            <strong>Keyboard:</strong> Enter = click/select, Space = start drag,
            Arrow keys = navigate drop targets, Escape = cancel.
          </Paragraph>

          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <div>
              Clicked item:{' '}
              <strong>{clickedItem ?? 'None (click an item)'}</strong>
            </div>
            <div>
              Drop count: <strong>{dropCount}</strong>
            </div>
          </div>

          <div
            style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}
          >
            <div>
              <Heading level="h4" margin="none">
                Clickable & Draggable Items
              </Heading>
              {['Item A', 'Item B', 'Item C'].map((name) => (
                <ClickableDraggableItem
                  key={name}
                  id={name}
                  type="clickable"
                  onClick={() => setClickedItem(name)}
                  isSelected={clickedItem === name}
                >
                  {name}
                </ClickableDraggableItem>
              ))}
            </div>
            <DropZone
              accepts={['clickable']}
              onDrop={() => setDropCount((c) => c + 1)}
            >
              Drop items here
            </DropZone>
          </div>
        </div>
      </>
    );
  },
};

export const TypeRestrictions: Story = {
  render: () => {
    const [lastDrop, setLastDrop] = useState<string>('');

    return (
      <>
        <div style={{ padding: '20px' }}>
          <Heading level="h3" margin="none">
            Type Restrictions
          </Heading>
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
              <Heading level="h4" margin="none">
                Items
              </Heading>
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
              <Heading level="h4" margin="none">
                Drop Zones
              </Heading>
              <DropZone
                accepts={['fruit']}
                onDrop={(metadata) => {
                  const id =
                    typeof metadata?.id === 'string' ? metadata.id : 'unknown';
                  setLastDrop(`Fruit: ${id}`);
                }}
              >
                Fruits Only
              </DropZone>
              <DropZone
                accepts={['vegetable']}
                onDrop={(metadata) => {
                  const id =
                    typeof metadata?.id === 'string' ? metadata.id : 'unknown';
                  setLastDrop(`Vegetable: ${id}`);
                }}
              >
                Vegetables Only
              </DropZone>
              <DropZone
                accepts={['fruit', 'vegetable', 'protein']}
                onDrop={(metadata) => {
                  const id =
                    typeof metadata?.id === 'string' ? metadata.id : 'unknown';
                  setLastDrop(`Any: ${id}`);
                }}
              >
                All Types
              </DropZone>
            </div>
          </div>
        </div>
      </>
    );
  },
};
