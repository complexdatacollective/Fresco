import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import { DragPreview } from '../lib/dnd/DragPreview';
import { useDragSource } from '../lib/dnd/useDragSource';
import { useDropTarget } from '../lib/dnd/useDropTarget';
import { useDndStore } from '../lib/dnd/store';
import { type DragMetadata } from '../lib/dnd/types';

// Example custom preview components
function CustomCardPreview({ title, color }: { title: string; color: string }) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: color,
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        transform: 'rotate(-3deg)',
        minWidth: '150px',
        textAlign: 'center',
        fontWeight: 'bold',
        color: 'white',
      }}
    >
      <div style={{ fontSize: '20px' }}>🎯</div>
      <div>{title}</div>
    </div>
  );
}

function MinimalPreview({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '8px 16px',
        backgroundColor: '#333',
        color: 'white',
        borderRadius: '20px',
        fontSize: '14px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '120px',
          height: '120px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          color: 'white',
          fontSize: '12px',
        }}
      >
        {alt}
      </div>
    </div>
  );
}

// Draggable item component
interface DraggableItemProps {
  id: string;
  type: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
  style?: React.CSSProperties;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function DraggableItem({
  id,
  type,
  children,
  preview,
  style = {},
  onDragStart,
  onDragEnd,
}: DraggableItemProps) {
  const { dragProps, isDragging } = useDragSource({
    metadata: { type, id },
    preview,
    onDragStart,
    onDragEnd,
  });

  return (
    <div
      {...dragProps}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: '#f5f5f5',
        border: '2px solid #ddd',
        borderRadius: '8px',
        cursor: 'grab',
        transition: 'all 0.2s',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Drop zone component
interface DropZoneProps {
  accepts: string[];
  children: React.ReactNode;
  onDrop?: (metadata: DragMetadata) => void;
  style?: React.CSSProperties;
}

function DropZone({ accepts, children, onDrop, style = {} }: DropZoneProps) {
  const { dropProps, isOver, willAccept } = useDropTarget({
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
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Story container with DragPreview
function StoryContainer({
  children,
  showInstructions = true,
  offset,
}: {
  children: React.ReactNode;
  showInstructions?: boolean;
  offset?: { x: number; y: number };
}) {
  return (
    <div
      style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '400px' }}
    >
      {showInstructions && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          <strong>Instructions:</strong> Drag items to see the preview following
          your cursor. The preview is rendered using a portal and positioned
          dynamically.
        </div>
      )}
      {children}
      <DragPreview offset={offset} />
    </div>
  );
}

// Demo component showing offset controls
function OffsetDemo() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <StoryContainer offset={offset}>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Preview Offset Controls</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label>
            X Offset:
            <input
              type="range"
              min="-50"
              max="50"
              value={offset.x}
              onChange={(e) =>
                setOffset({ ...offset, x: Number(e.target.value) })
              }
              style={{ marginLeft: '8px' }}
            />
            <span style={{ marginLeft: '8px' }}>{offset.x}px</span>
          </label>
          <label>
            Y Offset:
            <input
              type="range"
              min="-50"
              max="50"
              value={offset.y}
              onChange={(e) =>
                setOffset({ ...offset, y: Number(e.target.value) })
              }
              style={{ marginLeft: '8px' }}
            />
            <span style={{ marginLeft: '8px' }}>{offset.y}px</span>
          </label>
          <button onClick={() => setOffset({ x: 0, y: 0 })}>Reset</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <DraggableItem id="offset-1" type="card">
          Drag me with offset!
        </DraggableItem>
        <DropZone accepts={['card']}>Drop here</DropZone>
      </div>
    </StoryContainer>
  );
}

// Demo showing preview size behavior
function PreviewSizeDemo() {
  const [showStats, setShowStats] = useState(false);
  const dragStartTime = useRef<number>(0);
  const [dragDuration, setDragDuration] = useState<number>(0);

  return (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={showStats}
            onChange={(e) => setShowStats(e.target.checked)}
          />
          Show drag statistics
        </label>
        {showStats && dragDuration > 0 && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Last drag duration: {dragDuration}ms
          </div>
        )}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <div>
          <h4>Different Sized Items</h4>
          <DraggableItem
            id="small"
            type="item"
            onDragStart={() => {
              dragStartTime.current = Date.now();
            }}
            onDragEnd={() => {
              if (showStats) {
                setDragDuration(Date.now() - dragStartTime.current);
              }
            }}
          >
            Small
          </DraggableItem>
          <DraggableItem
            id="medium"
            type="item"
            style={{ padding: '24px', fontSize: '18px' }}
          >
            Medium Sized Item
          </DraggableItem>
          <DraggableItem
            id="large"
            type="item"
            style={{ padding: '32px', fontSize: '24px', minWidth: '200px' }}
          >
            Large Item with More Content
          </DraggableItem>
        </div>
        <div>
          <h4>Drop Zone</h4>
          <DropZone accepts={['item']} style={{ minHeight: '300px' }}>
            The preview automatically centers under your cursor
          </DropZone>
        </div>
      </div>
    </StoryContainer>
  );
}

const meta: Meta<typeof DragPreview> = {
  title: 'DnD/DragPreview',
  component: DragPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`DragPreview\` component renders a visual preview that follows the cursor during drag operations. It's a core part of the drag-and-drop system that provides visual feedback to users.

## Key Features:
- **Portal Rendering**: Renders in a portal to avoid z-index and overflow issues
- **Dynamic Positioning**: Automatically centers under the cursor with optional offset
- **Custom Preview Support**: Can display custom preview content or clone the dragged element
- **Performance Optimized**: Uses ResizeObserver for dynamic sizing and transform3d for smooth movement
- **Automatic Cleanup**: Properly manages DOM elements and event listeners

## Props:
- \`children\`: Fallback content to display if no custom preview is provided
- \`offset\`: Optional { x, y } offset from the cursor position

## Usage:
The DragPreview component should be rendered once at the root of your drag-and-drop container. It automatically shows/hides based on the global drag state managed by the Zustand store.

\`\`\`tsx
function App() {
  return (
    <div>
      {/* Your draggable items and drop zones */}
      <DragPreview offset={{ x: 10, y: 10 }} />
    </div>
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'Fallback content to display when no custom preview is set',
      control: 'text',
    },
    offset: {
      description: 'Offset from cursor position in pixels',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DragPreview>;

// Basic story showing default behavior
export const Default: Story = {
  render: () => (
    <StoryContainer>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div>
          <h3>Draggable Items</h3>
          <DraggableItem id="1" type="card">
            Default Card Preview
          </DraggableItem>
          <DraggableItem
            id="2"
            type="card"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Blue Card
          </DraggableItem>
          <DraggableItem
            id="3"
            type="card"
            style={{ backgroundColor: '#fff3e0' }}
          >
            Orange Card
          </DraggableItem>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Drop Zone</h3>
          <DropZone accepts={['card']}>
            Drop cards here - notice how the preview follows your cursor
          </DropZone>
        </div>
      </div>
    </StoryContainer>
  ),
};

// Story demonstrating custom preview content
export const CustomPreviews: Story = {
  render: () => (
    <StoryContainer>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}
      >
        <div>
          <h3>Items with Custom Previews</h3>
          <DraggableItem
            id="custom-1"
            type="fancy"
            preview={
              <CustomCardPreview title="Fancy Preview" color="#9c27b0" />
            }
          >
            Fancy Card (drag to see custom preview)
          </DraggableItem>
          <DraggableItem
            id="custom-2"
            type="minimal"
            preview={<MinimalPreview text="Dragging..." />}
          >
            Minimal Preview Style
          </DraggableItem>
          <DraggableItem
            id="custom-3"
            type="image"
            preview={
              <ImagePreview
                src="https://via.placeholder.com/150"
                alt="Placeholder Image"
              />
            }
          >
            Image Preview Example
          </DraggableItem>
          <DraggableItem id="custom-4" type="default">
            Default Preview (no custom)
          </DraggableItem>
        </div>
        <div>
          <h3>Drop Zones</h3>
          <DropZone accepts={['fancy', 'minimal', 'image', 'default']}>
            Universal Drop Zone
          </DropZone>
        </div>
      </div>
    </StoryContainer>
  ),
};

// Story showing offset positioning
export const OffsetPositioning: Story = {
  render: () => <OffsetDemo />,
};

// Story demonstrating different preview sizes
export const PreviewSizing: Story = {
  render: () => <PreviewSizeDemo />,
};

// Story showing multiple drag operations
export const MultipleDragContexts: Story = {
  render: () => {
    const [lastAction, setLastAction] = useState<string>('');

    return (
      <StoryContainer>
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <strong>Last Action:</strong> {lastAction || 'None'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px',
          }}
        >
          <div>
            <h4>Source A</h4>
            <DraggableItem
              id="a1"
              type="typeA"
              onDragStart={() =>
                setLastAction('Started dragging from Source A')
              }
              onDragEnd={() => setLastAction('Ended drag from Source A')}
              preview={<CustomCardPreview title="Type A" color="#2196f3" />}
            >
              Type A Item
            </DraggableItem>
          </div>
          <div>
            <h4>Source B</h4>
            <DraggableItem
              id="b1"
              type="typeB"
              onDragStart={() =>
                setLastAction('Started dragging from Source B')
              }
              onDragEnd={() => setLastAction('Ended drag from Source B')}
              preview={<CustomCardPreview title="Type B" color="#4caf50" />}
            >
              Type B Item
            </DraggableItem>
          </div>
          <div>
            <h4>Mixed Drop Zone</h4>
            <DropZone
              accepts={['typeA', 'typeB']}
              onDrop={(metadata) =>
                setLastAction(`Dropped ${metadata.type} item`)
              }
            >
              Accepts both types
            </DropZone>
          </div>
        </div>
      </StoryContainer>
    );
  },
};

// Story showing preview opacity
export const PreviewOpacity: Story = {
  render: () => (
    <StoryContainer>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
        }}
      >
        <strong>Note:</strong> The preview has a default opacity of 0.8 to
        indicate it's a preview, not the actual element.
      </div>
      <div style={{ display: 'flex', gap: '40px' }}>
        <div>
          <DraggableItem
            id="opacity-1"
            type="item"
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: 'white',
            }}
          >
            Gradient Background
          </DraggableItem>
          <DraggableItem
            id="opacity-2"
            type="item"
            style={{
              backgroundColor: '#333',
              color: 'white',
            }}
          >
            Dark Background
          </DraggableItem>
        </div>
        <DropZone accepts={['item']} style={{ flex: 1 }}>
          Notice the preview opacity
        </DropZone>
      </div>
    </StoryContainer>
  ),
};

// Story demonstrating performance with rapid movements
export const PerformanceTest: Story = {
  render: () => {
    const [moveCount, setMoveCount] = useState(0);
    const moveCountRef = useRef(0);

    // Subscribe to position updates
    useEffect(() => {
      const unsubscribe = useDndStore.subscribe(
        (state) => state.dragPosition,
        (dragPosition) => {
          if (dragPosition) {
            moveCountRef.current += 1;
            // Throttle state updates for display
            if (moveCountRef.current % 10 === 0) {
              setMoveCount(moveCountRef.current);
            }
          } else {
            moveCountRef.current = 0;
            setMoveCount(0);
          }
        },
      );

      return unsubscribe;
    }, []);

    return (
      <StoryContainer>
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#e0f2fe',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Performance Test</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            The preview uses transform3d for hardware acceleration and efficient
            positioning.
          </p>
          <div style={{ fontSize: '14px' }}>
            <strong>Position updates during drag:</strong> {moveCount}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '40px' }}>
          <DraggableItem
            id="perf-1"
            type="test"
            preview={
              <div
                style={{
                  padding: '20px',
                  background:
                    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                }}
              >
                Performance Test Preview
              </div>
            }
          >
            Drag me rapidly!
          </DraggableItem>
          <DropZone accepts={['test']} style={{ flex: 1 }}>
            Move the cursor quickly while dragging
          </DropZone>
        </div>
      </StoryContainer>
    );
  },
};

// Interactive playground with all features
export const Playground: Story = {
  render: () => {
    const [config, setConfig] = useState({
      offsetX: 0,
      offsetY: 0,
      useCustomPreview: false,
      previewStyle: 'default',
    });

    const getCustomPreview = () => {
      if (!config.useCustomPreview) return undefined;

      switch (config.previewStyle) {
        case 'card':
          return <CustomCardPreview title="Custom Card" color="#ff5722" />;
        case 'minimal':
          return <MinimalPreview text="Custom Preview" />;
        case 'image':
          return (
            <ImagePreview src="https://via.placeholder.com/100" alt="Custom" />
          );
        default:
          return undefined;
      }
    };

    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <div
          style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0' }}>DragPreview Playground</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                X Offset: {config.offsetX}px
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.offsetX}
                  onChange={(e) =>
                    setConfig({ ...config, offsetX: Number(e.target.value) })
                  }
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Y Offset: {config.offsetY}px
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.offsetY}
                  onChange={(e) =>
                    setConfig({ ...config, offsetY: Number(e.target.value) })
                  }
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={config.useCustomPreview}
                  onChange={(e) =>
                    setConfig({ ...config, useCustomPreview: e.target.checked })
                  }
                />
                Use Custom Preview
              </label>
              {config.useCustomPreview && (
                <select
                  value={config.previewStyle}
                  onChange={(e) =>
                    setConfig({ ...config, previewStyle: e.target.value })
                  }
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="default">Default</option>
                  <option value="card">Card Style</option>
                  <option value="minimal">Minimal Style</option>
                  <option value="image">Image Style</option>
                </select>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h4>Drag Sources</h4>
            <DraggableItem
              id="playground-1"
              type="playground"
              preview={getCustomPreview()}
            >
              Configurable Item 1
            </DraggableItem>
            <DraggableItem
              id="playground-2"
              type="playground"
              preview={getCustomPreview()}
              style={{ backgroundColor: '#e8f5e9' }}
            >
              Configurable Item 2
            </DraggableItem>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <h4>Drop Zone</h4>
            <DropZone accepts={['playground']} style={{ minHeight: '200px' }}>
              Test different configurations
            </DropZone>
          </div>
        </div>
        <DragPreview offset={{ x: config.offsetX, y: config.offsetY }} />
      </div>
    );
  },
};
