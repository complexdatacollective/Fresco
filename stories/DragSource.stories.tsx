import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import { useDragSource } from '../lib/dnd/useDragSource';
import { useDndStore } from '../lib/dnd/store';
import { type DragMetadata } from '../lib/dnd/types';

// Mock component that demonstrates drag source functionality
interface DragSourceExampleProps {
  metadata: DragMetadata;
  name?: string;
  preview?: React.ReactNode;
  disabled?: boolean;
  onDragStart?: (metadata: DragMetadata) => void;
  onDragEnd?: (metadata: DragMetadata, dropTargetId: string | null) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function DragSourceExample({
  metadata,
  name,
  preview,
  disabled = false,
  onDragStart,
  onDragEnd,
  children,
  className = '',
  style = {},
}: DragSourceExampleProps) {
  const { dragProps, isDragging } = useDragSource({
    metadata,
    name,
    preview,
    onDragStart,
    onDragEnd,
    disabled,
  });

  const baseStyle: React.CSSProperties = {
    padding: '16px',
    margin: '8px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    minWidth: '120px',
    textAlign: 'center',
    ...style,
  };

  const dragStyle: React.CSSProperties = isDragging
    ? {
        opacity: 0.5,
        backgroundColor: '#e0f2fe',
        borderColor: '#0277bd',
      }
    : {};

  return (
    <div
      {...dragProps}
      className={className}
      style={{ ...baseStyle, ...dragStyle, ...dragProps.style }}
    >
      {children || `${metadata.type} Item`}
      {isDragging && (
        <div style={{ fontSize: '12px', color: '#666' }}>Dragging...</div>
      )}
    </div>
  );
}

// Mock drop target for testing
function MockDropTarget({
  accepts,
  name,
  children,
}: {
  accepts: string[];
  name: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const registerDropTarget = useDndStore((state) => state.registerDropTarget);
  const unregisterDropTarget = useDndStore(
    (state) => state.unregisterDropTarget,
  );
  const activeDropTargetId = useDndStore((state) => state.activeDropTargetId);

  const targetId = useRef(
    `drop-target-${Math.random().toString(36).substr(2, 9)}`,
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    registerDropTarget({
      id: targetId.current,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      accepts,
      name,
    });

    return () => {
      unregisterDropTarget(targetId.current);
    };
  }, [accepts, name, registerDropTarget, unregisterDropTarget]);

  const isActive = activeDropTargetId === targetId.current;

  return (
    <div
      ref={ref}
      style={{
        padding: '20px',
        margin: '8px',
        border: '2px dashed #999',
        borderRadius: '8px',
        backgroundColor: isActive ? '#e8f5e8' : '#fafafa',
        borderColor: isActive ? '#4caf50' : '#999',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {children || `Drop ${accepts.join(', ')} here`}
      {isActive && (
        <div style={{ fontSize: '12px', color: '#2e7d32' }}> (Active)</div>
      )}
    </div>
  );
}

// Container for stories
function StoryContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <strong>Instructions:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Mouse/Touch: Click and drag items</li>
          <li>
            Keyboard: Focus an item, press Space/Enter to start dragging, use
            arrow keys to navigate, Space/Enter to drop, Escape to cancel
          </li>
        </ul>
      </div>
      {children}
    </div>
  );
}

// Custom preview component for demonstration
function CustomPreview({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#ff9800',
        color: 'white',
        borderRadius: '6px',
        fontWeight: 'bold',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      🚀 {children}
    </div>
  );
}

const meta: Meta<typeof DragSourceExample> = {
  title: 'DnD/useDragSource',
  component: DragSourceExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`useDragSource\` hook provides drag-and-drop functionality for source elements. It supports both mouse/touch and keyboard interactions with full accessibility features.

## Key Features:
- **Mouse/Touch Support**: Click and drag with pointer events
- **Keyboard Accessibility**: Full keyboard navigation with screen reader announcements
- **Custom Previews**: Support for custom drag preview components
- **Auto-scrolling**: Automatic scrolling when dragging near container edges
- **Type Safety**: Full TypeScript support with Zod validation

## Hook Options:
- \`metadata\`: Required drag data (type, sourceZone, etc.)
- \`name\`: Human-readable name for accessibility
- \`preview\`: Custom preview component (defaults to element clone)
- \`onDragStart\`: Callback when drag begins
- \`onDragEnd\`: Callback when drag ends (with drop target info)
- \`disabled\`: Disable drag functionality

## Returns:
- \`dragProps\`: Props to spread on draggable element
- \`isDragging\`: Boolean indicating current drag state
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    metadata: {
      control: 'object',
      description: 'Drag metadata containing type and other data',
    },
    name: {
      control: 'text',
      description: 'Human-readable name for accessibility announcements',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the drag source is disabled',
    },
    onDragStart: {
      action: 'dragStart',
      description: 'Callback fired when drag operation starts',
    },
    onDragEnd: {
      action: 'dragEnd',
      description: 'Callback fired when drag operation ends',
    },
  },
  args: {
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DragSourceExample>;

// Basic drag source story
export const Basic: Story = {
  args: {
    metadata: { type: 'card', id: '1' },
    name: 'Basic Card',
  },
  render: (args) => (
    <StoryContainer>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <DragSourceExample {...args}>Basic Draggable Card</DragSourceExample>
        <MockDropTarget accepts={['card']} name="Card Drop Zone">
          Drop cards here
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};

// Multiple drag sources with different types
export const MultipleSources: Story = {
  args: {
    metadata: { type: 'card', id: '1' },
    name: 'Card Item',
  },
  render: () => (
    <StoryContainer>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
        }}
      >
        <DragSourceExample
          metadata={{ type: 'card', id: '1' }}
          name="Blue Card"
          style={{ backgroundColor: '#e3f2fd' }}
        >
          Blue Card
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'token', id: '2' }}
          name="Red Token"
          style={{ backgroundColor: '#ffebee', borderRadius: '50%' }}
        >
          Red Token
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'card', id: '3' }}
          name="Green Card"
          style={{ backgroundColor: '#e8f5e8' }}
        >
          Green Card
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'special', id: '4' }}
          name="Special Item"
          style={{ backgroundColor: '#fff3e0' }}
        >
          Special Item
        </DragSourceExample>
      </div>
      <div
        style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        <MockDropTarget accepts={['card']} name="Cards Only">
          Cards Only
        </MockDropTarget>
        <MockDropTarget accepts={['token', 'special']} name="Tokens & Special">
          Tokens & Special Items
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};

// Accessibility features demonstration
export const AccessibilityFeatures: Story = {
  args: {
    metadata: { type: 'accessible-item', id: '1' },
    name: 'Screen Reader Friendly Item',
  },
  render: () => (
    <StoryContainer>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Accessibility Features</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>All drag sources have proper ARIA labels and roles</li>
          <li>Keyboard navigation with arrow keys</li>
          <li>Screen reader announcements during drag operations</li>
          <li>Focus management and visual indicators</li>
        </ul>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <DragSourceExample
          metadata={{ type: 'document', id: '1' }}
          name="Important Document"
        >
          Important Document
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'image', id: '2' }}
          name="Profile Photo"
        >
          Profile Photo
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'video', id: '3' }}
          name="Tutorial Video"
        >
          Tutorial Video
        </DragSourceExample>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <MockDropTarget accepts={['document', 'image']} name="Media Library">
          Media Library
        </MockDropTarget>
        <MockDropTarget accepts={['video']} name="Video Gallery">
          Video Gallery
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};

// Custom preview demonstration
export const CustomPreviewDemo: Story = {
  args: {
    metadata: { type: 'custom-item', id: '1' },
    name: 'Item with Custom Preview',
  },
  render: () => (
    <StoryContainer>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#fff8e1',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Custom Preview Examples</h3>
        <p style={{ margin: 0 }}>
          These items show different preview styles when dragged.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <DragSourceExample
          metadata={{ type: 'file', id: '1' }}
          name="File with Custom Preview"
          preview={<CustomPreview>Custom File Preview</CustomPreview>}
        >
          File (Custom Preview)
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'file', id: '2' }}
          name="File with Default Preview"
        >
          File (Default Preview)
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'file', id: '3' }}
          name="File with No Preview"
          preview={null}
        >
          File (No Preview)
        </DragSourceExample>
      </div>
      <div style={{ marginTop: '20px' }}>
        <MockDropTarget accepts={['file']} name="File Drop Zone">
          Drop files here
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};

// Disabled state demonstration
export const DisabledState: Story = {
  args: {
    metadata: { type: 'item', id: '1' },
    name: 'Disabled Item',
    disabled: true,
  },
  render: () => (
    <StoryContainer>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Disabled State</h3>
        <p style={{ margin: 0 }}>
          Disabled items cannot be dragged and have appropriate visual styling
          and accessibility attributes.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <DragSourceExample
          metadata={{ type: 'item', id: '1' }}
          name="Enabled Item"
          disabled={false}
          style={{ backgroundColor: '#e8f5e8' }}
        >
          Enabled Item
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'item', id: '2' }}
          name="Disabled Item"
          disabled={true}
          style={{
            backgroundColor: '#f5f5f5',
            color: '#999',
            cursor: 'not-allowed',
          }}
        >
          Disabled Item
        </DragSourceExample>
      </div>
      <div style={{ marginTop: '20px' }}>
        <MockDropTarget accepts={['item']} name="Item Drop Zone">
          Drop enabled items here
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};

// Interactive playground
export const InteractivePlayground: Story = {
  args: {
    metadata: { type: 'playground-item', id: '1' },
    name: 'Playground Item',
    disabled: false,
  },
  render: (args) => {
    const [dragCount, setDragCount] = useState(0);
    const [lastDropTarget, setLastDropTarget] = useState<string | null>(null);

    return (
      <StoryContainer>
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Interactive Playground</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            Use the controls below to test different configurations.
          </p>
          <div style={{ fontSize: '14px' }}>
            <div>Drags started: {dragCount}</div>
            <div>Last drop target: {lastDropTarget || 'None'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <DragSourceExample
            {...args}
            onDragStart={(metadata) => {
              setDragCount((prev) => prev + 1);
              args.onDragStart?.(metadata);
            }}
            onDragEnd={(metadata, dropTargetId) => {
              setLastDropTarget(dropTargetId);
              args.onDragEnd?.(metadata, dropTargetId);
            }}
          >
            Playground Item
          </DragSourceExample>
        </div>
        <div
          style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          <MockDropTarget accepts={['playground-item']} name="Drop Zone 1">
            Drop Zone 1
          </MockDropTarget>
          <MockDropTarget accepts={['playground-item']} name="Drop Zone 2">
            Drop Zone 2
          </MockDropTarget>
          <MockDropTarget accepts={['other-type']} name="Incompatible Zone">
            Incompatible Zone
          </MockDropTarget>
        </div>
      </StoryContainer>
    );
  },
};

// Keyboard navigation focus test
export const KeyboardNavigation: Story = {
  args: {
    metadata: { type: 'nav-item', id: '1' },
    name: 'Keyboard Navigation Item',
  },
  render: () => (
    <StoryContainer>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#e8eaf6',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Keyboard Navigation Test</h3>
        <p style={{ margin: 0 }}>
          Tab to focus items, then use Space/Enter to start dragging. Use arrow
          keys to navigate between drop zones during drag.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <DragSourceExample
          metadata={{ type: 'nav-item', id: '1', sourceZone: 'source' }}
          name="Navigation Item 1"
        >
          Nav Item 1
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'nav-item', id: '2', sourceZone: 'source' }}
          name="Navigation Item 2"
        >
          Nav Item 2
        </DragSourceExample>
        <DragSourceExample
          metadata={{ type: 'nav-item', id: '3', sourceZone: 'source' }}
          name="Navigation Item 3"
        >
          Nav Item 3
        </DragSourceExample>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
        }}
      >
        <MockDropTarget accepts={['nav-item']} name="Target Zone A">
          Target Zone A
        </MockDropTarget>
        <MockDropTarget accepts={['nav-item']} name="Target Zone B">
          Target Zone B
        </MockDropTarget>
      </div>
    </StoryContainer>
  ),
};
