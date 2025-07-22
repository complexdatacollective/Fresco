import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import { DndStoreProvider } from '../lib/dnd/DndStoreProvider';
import { useDropTarget } from '../lib/dnd/useDropTarget';
import { useDragSource } from '../lib/dnd/useDragSource';
import { type DragMetadata, type DropCallback } from '../lib/dnd/types';

// Mock drag source component for testing drop targets
interface MockDragSourceProps {
  metadata: DragMetadata;
  name?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

function MockDragSource({
  metadata,
  name,
  children,
  style = {},
}: MockDragSourceProps) {
  const { dragProps, isDragging } = useDragSource({
    type: metadata.type as string,
    metadata,
    announcedName: name,
  });

  const baseStyle: React.CSSProperties = {
    padding: '12px 16px',
    margin: '4px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    cursor: 'grab',
    display: 'inline-block',
    userSelect: 'none',
    fontSize: '14px',
    ...style,
  };

  const dragStyle: React.CSSProperties = isDragging
    ? {
        opacity: 0.6,
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
        cursor: 'grabbing',
      }
    : {};

  return (
    <div
      {...dragProps}
      style={{ ...baseStyle, ...dragStyle, ...dragProps.style }}
    >
      {children || `${metadata.type} Item`}
      {isDragging && (
        <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
          (dragging)
        </span>
      )}
    </div>
  );
}

// Main DropTarget example component
interface DropTargetExampleProps {
  accepts: string[];
  zoneId?: string;
  name?: string;
  onDrop?: DropCallback;
  onDragEnter?: (metadata: DragMetadata) => void;
  onDragLeave?: (metadata: DragMetadata) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number;
}

function DropTargetExample({
  accepts,
  zoneId,
  name,
  onDrop,
  onDragEnter,
  onDragLeave,
  disabled = false,
  children,
  className = '',
  style = {},
  minHeight = 100,
}: DropTargetExampleProps) {
  const dropId =
    zoneId || `drop-target-${Math.random().toString(36).substr(2, 9)}`;
  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: dropId,
    accepts,
    announcedName: name,
    onDrop: onDrop ? (metadata) => onDrop(metadata || {}) : undefined,
    onDragEnter: onDragEnter
      ? (metadata) => onDragEnter(metadata || {})
      : undefined,
    onDragLeave: onDragLeave
      ? (metadata) => onDragLeave(metadata || {})
      : undefined,
    disabled,
  });

  const baseStyle: React.CSSProperties = {
    padding: '20px',
    margin: '8px',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    minHeight: minHeight,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    ...style,
  };

  const statusStyle: React.CSSProperties = (() => {
    if (disabled) {
      return {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
        color: '#999',
        cursor: 'not-allowed',
      };
    }
    if (isOver && willAccept) {
      return {
        backgroundColor: '#e8f5e8',
        borderColor: '#4caf50',
        borderStyle: 'solid',
        transform: 'scale(1.02)',
      };
    }
    if (isOver && !willAccept) {
      return {
        backgroundColor: '#ffebee',
        borderColor: '#f44336',
        borderStyle: 'solid',
      };
    }
    if (isDragging && willAccept) {
      return {
        backgroundColor: '#f3e5f5',
        borderColor: '#9c27b0',
      };
    }
    if (isDragging && !willAccept) {
      return {
        backgroundColor: '#fafafa',
        borderColor: '#e0e0e0',
        opacity: 0.7,
      };
    }
    return {};
  })();

  return (
    <div
      {...dropProps}
      className={className}
      style={{ ...baseStyle, ...statusStyle, ...dropProps.style }}
    >
      <div style={{ fontSize: '14px', fontWeight: '500' }}>
        {children || (
          <>
            Drop {accepts.join(', ')} here
            {zoneId && (
              <div
                style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}
              >
                Zone: {zoneId}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status indicators */}
      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
        {disabled && <div>🚫 Disabled</div>}
        {isOver && willAccept && <div>✅ Ready to drop!</div>}
        {isOver && !willAccept && <div>❌ Cannot accept this type</div>}
        {isDragging && !isOver && willAccept && <div>👀 Watching for drop</div>}
        {isDragging && !isOver && !willAccept && (
          <div>👁️ Cannot accept dragged item</div>
        )}
        {!isDragging && <div>💤 Waiting for drag</div>}
      </div>

      {/* Accessibility info */}
      {name && (
        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
          Accessible name: "{name}"
        </div>
      )}
    </div>
  );
}

// Container for stories
function StoryContainer({ children }: { children: React.ReactNode }) {
  return (
    <DndStoreProvider>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              Mouse/Touch: Drag items from the source section to drop zones
            </li>
            <li>
              Keyboard: Focus a draggable item, press Space/Enter to start
              dragging, use arrow keys to navigate between drop zones,
              Space/Enter to drop, Escape to cancel
            </li>
            <li>Watch for visual feedback and status indicators</li>
          </ul>
        </div>
        {children}
      </div>
    </DndStoreProvider>
  );
}

const meta: Meta<typeof DropTargetExample> = {
  title: 'DnD/useDropTarget',
  component: DropTargetExample,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`useDropTarget\` hook provides drop functionality for target elements in drag-and-drop operations. It supports type-based acceptance filtering, zone-based logic, and comprehensive accessibility features.

## Key Features:
- **Type-based Acceptance**: Accept only specific item types via the \`accepts\` array
- **Zone Logic**: Prevent dropping items back into their source zone using \`zoneId\`
- **Real-time Feedback**: Visual and accessibility feedback during drag operations
- **Accessibility Support**: ARIA attributes, keyboard navigation, and screen reader announcements
- **Event Callbacks**: \`onDrop\`, \`onDragEnter\`, and \`onDragLeave\` callbacks
- **Disabled State**: Support for temporarily disabling drop targets

## Hook Options:
- \`accepts\`: Array of item types that can be dropped (required)
- \`zoneId\`: Zone identifier to prevent dropping back to source zone
- \`name\`: Human-readable name for accessibility
- \`onDrop\`: Callback when item is successfully dropped
- \`onDragEnter\`: Callback when drag enters the drop zone
- \`onDragLeave\`: Callback when drag leaves the drop zone
- \`disabled\`: Disable drop functionality

## Returns:
- \`dropProps\`: Props to spread on drop target element
- \`isOver\`: Boolean indicating if drag is currently over this target
- \`willAccept\`: Boolean indicating if current drag item can be accepted
- \`isDragging\`: Boolean indicating if any drag operation is active

## Accessibility Features:
- Proper ARIA attributes (\`aria-dropeffect\`, \`aria-label\`)
- Keyboard navigation support with focus management
- Screen reader announcements during operations
- Visual focus indicators
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    accepts: {
      control: 'object',
      description: 'Array of item types that can be accepted',
    },
    zoneId: {
      control: 'text',
      description: 'Zone identifier for preventing same-zone drops',
    },
    name: {
      control: 'text',
      description: 'Human-readable name for accessibility',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the drop target is disabled',
    },
    onDrop: {
      action: 'onDrop',
      description: 'Callback fired when an item is dropped',
    },
    onDragEnter: {
      action: 'onDragEnter',
      description: 'Callback fired when drag enters the zone',
    },
    onDragLeave: {
      action: 'onDragLeave',
      description: 'Callback fired when drag leaves the zone',
    },
  },
  args: {
    onDrop: () => {},
    onDragEnter: () => {},
    onDragLeave: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DropTargetExample>;

// Basic drop target story
export const Basic: Story = {
  args: {
    accepts: ['card'],
    name: 'Basic Drop Zone',
  },
  render: (args) => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Drag Sources</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MockDragSource
            metadata={{ type: 'card', id: '1' }}
            name="Blue Card"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Blue Card
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'token', id: '2' }}
            name="Red Token"
            style={{ backgroundColor: '#ffebee' }}
          >
            Red Token
          </MockDragSource>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 10px 0' }}>Drop Target</h3>
        <DropTargetExample {...args} />
      </div>
    </StoryContainer>
  ),
};

// Multiple drop targets with different acceptance rules
export const MultipleTargets: Story = {
  args: {
    accepts: ['card'],
    name: 'Card Drop Zone',
  },
  render: () => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Drag Sources</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MockDragSource
            metadata={{ type: 'card', id: '1' }}
            name="Card Item"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Card
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'token', id: '2' }}
            name="Token Item"
            style={{ backgroundColor: '#fff3e0' }}
          >
            Token
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'file', id: '3' }}
            name="File Item"
            style={{ backgroundColor: '#e8f5e8' }}
          >
            File
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'special', id: '4' }}
            name="Special Item"
            style={{ backgroundColor: '#fce4ec' }}
          >
            Special
          </MockDragSource>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 10px 0' }}>Drop Targets</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <DropTargetExample
            accepts={['card']}
            name="Cards Only"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Cards Only
          </DropTargetExample>

          <DropTargetExample
            accepts={['token', 'file']}
            name="Tokens & Files"
            style={{ backgroundColor: '#fff8e1' }}
          >
            Tokens & Files
          </DropTargetExample>

          <DropTargetExample
            accepts={['card', 'token', 'file', 'special']}
            name="Accept All"
            style={{ backgroundColor: '#f3e5f5' }}
          >
            Accept All Types
          </DropTargetExample>

          <DropTargetExample
            accepts={['nonexistent']}
            name="Accept None"
            style={{ backgroundColor: '#ffebee' }}
          >
            Nothing Accepted
          </DropTargetExample>
        </div>
      </div>
    </StoryContainer>
  ),
};

// Zone-based dropping demonstration
export const ZoneBasedDropping: Story = {
  args: {
    accepts: ['item'],
    zoneId: 'zone-a',
    name: 'Zone A Drop Target',
  },
  render: () => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Zone-based Logic Demo</h3>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f0f8ff',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          Items cannot be dropped back into their source zone. Try dragging from
          Zone A to Zone B and vice versa.
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <div>
          <h4 style={{ margin: '0 0 10px 0' }}>Zone A</h4>
          <div style={{ marginBottom: '16px' }}>
            <MockDragSource
              metadata={{ type: 'item', id: '1', sourceZone: 'zone-a' }}
              name="Item from Zone A"
              style={{ backgroundColor: '#e8f5e8' }}
            >
              Item from Zone A
            </MockDragSource>
          </div>
          <DropTargetExample
            accepts={['item']}
            zoneId="zone-a"
            name="Zone A Drop Target"
            style={{ backgroundColor: '#e8f5e8' }}
          >
            Zone A Drop Target
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Cannot accept items from Zone A
            </div>
          </DropTargetExample>
        </div>

        <div>
          <h4 style={{ margin: '0 0 10px 0' }}>Zone B</h4>
          <div style={{ marginBottom: '16px' }}>
            <MockDragSource
              metadata={{ type: 'item', id: '2', sourceZone: 'zone-b' }}
              name="Item from Zone B"
              style={{ backgroundColor: '#e3f2fd' }}
            >
              Item from Zone B
            </MockDragSource>
          </div>
          <DropTargetExample
            accepts={['item']}
            zoneId="zone-b"
            name="Zone B Drop Target"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Zone B Drop Target
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Cannot accept items from Zone B
            </div>
          </DropTargetExample>
        </div>
      </div>
    </StoryContainer>
  ),
};

// Accessibility features demonstration
export const AccessibilityFeatures: Story = {
  args: {
    accepts: ['document'],
    name: 'Accessible Document Drop Zone',
  },
  render: () => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Accessibility Features</h3>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0' }}>
            Accessibility Features Included:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>ARIA labels and dropeffect attributes</li>
            <li>
              Keyboard navigation support (Tab, Arrow keys, Space/Enter, Escape)
            </li>
            <li>Screen reader announcements during drag operations</li>
            <li>Focus management for keyboard users</li>
            <li>Visual focus indicators</li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Documents to Drag</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MockDragSource
            metadata={{ type: 'document', id: '1' }}
            name="Important Document"
          >
            📄 Important Document
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'image', id: '2' }}
            name="Profile Photo"
          >
            🖼️ Profile Photo
          </MockDragSource>
          <MockDragSource
            metadata={{ type: 'document', id: '3' }}
            name="Research Paper"
          >
            📝 Research Paper
          </MockDragSource>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <DropTargetExample
          accepts={['document']}
          name="Document Archive - Primary drop zone for important documents"
          style={{ backgroundColor: '#e8f5e8' }}
        >
          📁 Document Archive
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Documents only
          </div>
        </DropTargetExample>

        <DropTargetExample
          accepts={['image']}
          name="Image Gallery - Dedicated space for photos and images"
          style={{ backgroundColor: '#fff3e0' }}
        >
          🖼️ Image Gallery
          <div style={{ fontSize: '12px', marginTop: '8px' }}>Images only</div>
        </DropTargetExample>
      </div>
    </StoryContainer>
  ),
};

// Callback functionality demonstration
export const CallbackFunctionality: Story = {
  args: {
    accepts: ['item'],
    name: 'Callback Demo Zone',
  },
  render: () => {
    const [events, setEvents] = useState<string[]>([]);
    const [dropCount, setDropCount] = useState(0);

    const addEvent = (event: string) => {
      setEvents((prev) => [
        ...prev.slice(-4),
        `${new Date().toLocaleTimeString()}: ${event}`,
      ]);
    };

    return (
      <StoryContainer>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Callback Events Demo</h3>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            <div>Total drops: {dropCount}</div>
            <div style={{ marginTop: '8px' }}>
              <strong>Recent events:</strong>
              <div
                style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}
              >
                {events.length === 0 ? (
                  'No events yet...'
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {events.map((event, index) => (
                      <li key={index}>{event}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Drag Sources</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <MockDragSource
              metadata={{ type: 'item', id: '1', label: 'Alpha' }}
              name="Alpha Item"
              style={{ backgroundColor: '#e3f2fd' }}
            >
              Alpha Item
            </MockDragSource>
            <MockDragSource
              metadata={{ type: 'item', id: '2', label: 'Beta' }}
              name="Beta Item"
              style={{ backgroundColor: '#e8f5e8' }}
            >
              Beta Item
            </MockDragSource>
            <MockDragSource
              metadata={{ type: 'other', id: '3', label: 'Gamma' }}
              name="Gamma Item"
              style={{ backgroundColor: '#ffebee' }}
            >
              Gamma Item (Wrong Type)
            </MockDragSource>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          <DropTargetExample
            accepts={['item']}
            name="Callback Demo Zone"
            onDrop={(metadata) => {
              addEvent(
                `Dropped: ${(metadata as any)?.label || (metadata as any)?.id}`,
              );
              setDropCount((prev) => prev + 1);
            }}
            onDragEnter={(metadata) => {
              addEvent(
                `Drag entered with: ${(metadata as any)?.label || (metadata as any)?.id}`,
              );
            }}
            onDragLeave={(metadata) => {
              addEvent(
                `Drag left with: ${(metadata as any)?.label || (metadata as any)?.id}`,
              );
            }}
            style={{ backgroundColor: '#f3e5f5' }}
          >
            Interactive Drop Zone
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Watch the events above!
            </div>
          </DropTargetExample>

          <DropTargetExample
            accepts={['item']}
            name="Silent Drop Zone"
            style={{ backgroundColor: '#f8f9fa' }}
          >
            Silent Drop Zone
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              No callbacks configured
            </div>
          </DropTargetExample>
        </div>
      </StoryContainer>
    );
  },
};

// Disabled state demonstration
export const DisabledState: Story = {
  args: {
    accepts: ['item'],
    name: 'Disabled Drop Zone',
    disabled: true,
  },
  render: (args) => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Disabled State Demo</h3>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fff3e0',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          Disabled drop targets cannot accept drops and show appropriate visual
          and accessibility feedback.
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Drag Sources</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MockDragSource
            metadata={{ type: 'item', id: '1' }}
            name="Test Item"
            style={{ backgroundColor: '#e3f2fd' }}
          >
            Test Item
          </MockDragSource>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <DropTargetExample
          accepts={['item']}
          name="Enabled Drop Zone"
          disabled={false}
          style={{ backgroundColor: '#e8f5e8' }}
        >
          ✅ Enabled Drop Zone
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Ready to accept drops
          </div>
        </DropTargetExample>

        <DropTargetExample
          accepts={['item']}
          name="Disabled Drop Zone"
          disabled={true}
          style={{ backgroundColor: '#f5f5f5' }}
        >
          🚫 Disabled Drop Zone
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Cannot accept drops
          </div>
        </DropTargetExample>
      </div>
    </StoryContainer>
  ),
};

// Interactive controls playground
export const InteractivePlayground: Story = {
  args: {
    accepts: ['playground-item'],
    zoneId: undefined,
    name: 'Playground Drop Zone',
    disabled: false,
  },
  render: (args) => {
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [stats, setStats] = useState({
      enters: 0,
      leaves: 0,
      drops: 0,
    });

    const logEvent = (event: string, data?: any) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = data
        ? `${timestamp}: ${event} (${JSON.stringify(data)})`
        : `${timestamp}: ${event}`;
      setEventLog((prev) => [logEntry, ...prev.slice(0, 9)]);
    };

    return (
      <StoryContainer>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Interactive Playground</h3>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f0f8ff',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            Use the controls below to test different drop target configurations.
            Watch the statistics and event log for detailed feedback.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Drag Sources</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <MockDragSource
                  metadata={{ type: 'playground-item', id: '1', category: 'A' }}
                  name="Item A"
                  style={{ backgroundColor: '#e3f2fd' }}
                >
                  Item A
                </MockDragSource>
                <MockDragSource
                  metadata={{ type: 'playground-item', id: '2', category: 'B' }}
                  name="Item B"
                  style={{ backgroundColor: '#e8f5e8' }}
                >
                  Item B
                </MockDragSource>
                <MockDragSource
                  metadata={{ type: 'other-type', id: '3', category: 'C' }}
                  name="Other Type"
                  style={{ backgroundColor: '#ffebee' }}
                >
                  Other Type
                </MockDragSource>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Drop Target</h4>
              <DropTargetExample
                {...args}
                onDrop={(metadata) => {
                  setStats((prev) => ({ ...prev, drops: prev.drops + 1 }));
                  logEvent('Drop', metadata);
                  args.onDrop?.(metadata);
                }}
                onDragEnter={(metadata) => {
                  setStats((prev) => ({ ...prev, enters: prev.enters + 1 }));
                  logEvent('Drag Enter', metadata);
                  args.onDragEnter?.(metadata);
                }}
                onDragLeave={(metadata) => {
                  setStats((prev) => ({ ...prev, leaves: prev.leaves + 1 }));
                  logEvent('Drag Leave', metadata);
                  args.onDragLeave?.(metadata);
                }}
                minHeight={120}
              />
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Statistics</h4>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <div>Drag Enters: {stats.enters}</div>
                <div>Drag Leaves: {stats.leaves}</div>
                <div>Successful Drops: {stats.drops}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Event Log</h4>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  fontSize: '11px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {eventLog.length === 0 ? (
                  <div style={{ color: '#666' }}>No events yet...</div>
                ) : (
                  eventLog.map((event, index) => (
                    <div key={index} style={{ marginBottom: '2px' }}>
                      {event}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </StoryContainer>
    );
  },
};

// Complex layout with nested zones
export const ComplexLayout: Story = {
  args: {
    accepts: ['file'],
    name: 'Complex Layout Demo',
  },
  render: () => (
    <StoryContainer>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>
          Complex Layout with Multiple Zones
        </h3>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f0f8ff',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          This demonstrates a more complex layout with multiple drop zones,
          different acceptance rules, and zone-based logic working together.
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}
      >
        {/* Source panel */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0' }}>File Sources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <MockDragSource
              metadata={{ type: 'document', id: '1', sourceZone: 'source' }}
              name="Text Document"
              style={{ backgroundColor: '#e3f2fd' }}
            >
              📄 Text Document
            </MockDragSource>
            <MockDragSource
              metadata={{ type: 'image', id: '2', sourceZone: 'source' }}
              name="Image File"
              style={{ backgroundColor: '#e8f5e8' }}
            >
              🖼️ Image File
            </MockDragSource>
            <MockDragSource
              metadata={{ type: 'video', id: '3', sourceZone: 'source' }}
              name="Video File"
              style={{ backgroundColor: '#fff3e0' }}
            >
              🎥 Video File
            </MockDragSource>
            <MockDragSource
              metadata={{ type: 'archive', id: '4', sourceZone: 'source' }}
              name="Archive File"
              style={{ backgroundColor: '#fce4ec' }}
            >
              📦 Archive File
            </MockDragSource>
          </div>
        </div>

        {/* Target zones */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <DropTargetExample
            accepts={['document']}
            zoneId="documents"
            name="Document Storage"
            style={{ backgroundColor: '#e3f2fd' }}
            minHeight={80}
          >
            📁 Documents
          </DropTargetExample>

          <DropTargetExample
            accepts={['image', 'video']}
            zoneId="media"
            name="Media Library"
            style={{ backgroundColor: '#e8f5e8' }}
            minHeight={80}
          >
            🎨 Media
          </DropTargetExample>

          <DropTargetExample
            accepts={['archive']}
            zoneId="archives"
            name="Archive Storage"
            style={{ backgroundColor: '#fff3e0' }}
            minHeight={80}
          >
            📦 Archives
          </DropTargetExample>

          <DropTargetExample
            accepts={['document', 'image', 'video', 'archive']}
            zoneId="trash"
            name="Trash Bin"
            style={{ backgroundColor: '#ffebee' }}
            minHeight={80}
          >
            🗑️ Trash
          </DropTargetExample>
        </div>
      </div>

      {/* Processing area */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Processing Queue</h4>
        <DropTargetExample
          accepts={['document', 'image', 'video']}
          zoneId="processing"
          name="Processing Queue - Drop files here for batch processing"
          style={{
            backgroundColor: '#f3e5f5',
            width: '100%',
            minHeight: 60,
          }}
        >
          ⚙️ Processing Queue - Drop files for batch processing
        </DropTargetExample>
      </div>
    </StoryContainer>
  ),
};
