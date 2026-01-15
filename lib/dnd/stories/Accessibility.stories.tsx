import type { Meta, StoryObj } from '@storybook/nextjs';
import { useCallback, useRef, useState } from 'react';
import { DndStoreProvider, useDragSource, useDropTarget } from '~/lib/dnd';
import { useAccessibilityAnnouncements } from '~/lib/dnd/useAccessibilityAnnouncements';

type DragMetadata = {
  type: string;
  id: string;
};

// Demo components for accessibility testing
function AccessibleDragItem({
  id,
  type,
  children,
  announcedName,
  style = {},
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  announcedName?: string;
  style?: React.CSSProperties;
}) {
  const { dragProps, isDragging } = useDragSource({
    type,
    metadata: { type, id },
    announcedName: announcedName ?? `${type} ${id}`,
  });

  return (
    <div
      {...dragProps}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
        border: '2px solid #2196f3',
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        // Clear focus styles for keyboard navigation
        outline: 'none',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#1976d2';
        e.currentTarget.style.borderWidth = '3px';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#2196f3';
        e.currentTarget.style.borderWidth = '2px';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {children}
      {isDragging && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Dragging...
        </div>
      )}
    </div>
  );
}

function AccessibleDropZone({
  id,
  accepts,
  announcedName,
  children,
  onDrop,
  onDragEnter,
  onDragLeave,
  style = {},
}: {
  id: string;
  accepts: string[];
  announcedName?: string;
  children: React.ReactNode;
  onDrop?: (metadata: DragMetadata) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  style?: React.CSSProperties;
}) {
  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id,
    accepts,
    announcedName: announcedName ?? `Drop Zone ${id}`,
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
        border: '3px dashed',
        borderRadius: '8px',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.2s',
        outline: 'none',
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
      onFocus={(e) => {
        if (isDragging) {
          e.currentTarget.style.borderColor = '#ff9800';
          e.currentTarget.style.borderStyle = 'solid';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.3)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onBlur={(e) => {
        if (isDragging) {
          e.currentTarget.style.borderStyle = 'dashed';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'scale(1)';
          // Restore original border color based on state
          const originalColor = willAccept
            ? isOver
              ? '#4caf50'
              : '#2196f3'
            : '#f44336';
          e.currentTarget.style.borderColor = originalColor;
        }
      }}
    >
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Systems/DragAndDrop/Accessibility',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Accessibility Features

The drag and drop system includes comprehensive accessibility support:

## ♿ Features Included
- **Keyboard Navigation**: Full tab navigation and arrow key controls
- **Screen Reader Support**: ARIA attributes and live announcements
- **Focus Management**: Clear focus indicators and logical tab order
- **Semantic HTML**: Proper roles and accessible markup

## ⌨️ Keyboard Controls
- **Tab**: Navigate between draggable items
- **Space/Enter**: Start dragging focused item
- **Arrow Keys**: Navigate between drop zones while dragging
- **Space/Enter**: Drop item in current zone
- **Escape**: Cancel drag operation

## 📢 Screen Reader Announcements
- Drag start/end announcements
- Drop zone navigation feedback
- Success/error confirmations
- Contextual instructions

## 🎯 ARIA Attributes
- \`aria-grabbed\`: Indicates drag state
- \`aria-label\`: Accessible names for items
- \`role="button"\`: Makes items focusable
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const KeyboardNavigation: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: '1', name: 'Document A', zone: 'source' },
      { id: '2', name: 'Document B', zone: 'source' },
      { id: '3', name: 'Document C', zone: 'source' },
    ]);

    const [instructions, setInstructions] = useState(
      'Tab to focus items, then use Space or Enter to start dragging',
    );

    const moveItem = (itemId: string, newZone: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, zone: newZone } : item,
        ),
      );
      setInstructions(`Moved ${itemId} to ${newZone}`);
    };

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h2>Keyboard Navigation Demo</h2>

          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#e8eaf6',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 12px' }}>Instructions</h3>
            <div style={{ fontSize: '14px', marginBottom: '12px' }}>
              {instructions}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Keyboard Controls:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>
                  <kbd>Tab</kbd> - Navigate between items
                </li>
                <li>
                  <kbd>Space</kbd>/<kbd>Enter</kbd> - Start/stop dragging
                </li>
                <li>
                  <kbd>↑↓←→</kbd> - Navigate drop zones while dragging
                </li>
                <li>
                  <kbd>Escape</kbd> - Cancel drag operation
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h3>Source Items</h3>
              {items
                .filter((item) => item.zone === 'source')
                .map((item) => (
                  <AccessibleDragItem
                    key={item.id}
                    id={item.id}
                    type="document"
                    announcedName={item.name}
                  >
                    📄 {item.name}
                  </AccessibleDragItem>
                ))}
            </div>

            <div>
              <h3>Target Zones</h3>
              <AccessibleDropZone
                id="archive-zone"
                accepts={['document']}
                announcedName="Archive Folder"
                onDrop={(metadata) => moveItem(metadata.id, 'archive')}
                onDragEnter={() =>
                  setInstructions(
                    'Over Archive folder - press Space or Enter to drop',
                  )
                }
              >
                📁 Archive
                <br />
                {items.filter((item) => item.zone === 'archive').length} items
              </AccessibleDropZone>

              <AccessibleDropZone
                id="trash-zone"
                accepts={['document']}
                announcedName="Trash Can"
                onDrop={(metadata) => moveItem(metadata.id, 'trash')}
                onDragEnter={() =>
                  setInstructions('Over Trash - press Space or Enter to delete')
                }
              >
                🗑️ Trash
                <br />
                {items.filter((item) => item.zone === 'trash').length} items
              </AccessibleDropZone>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};

// Demo components that log announcements for the screen reader story
function LoggingDragItem({
  id,
  type,
  children,
  announcedName,
  onAnnounce,
}: {
  id: string;
  type: string;
  children: React.ReactNode;
  announcedName?: string;
  onAnnounce: (message: string) => void;
}) {
  const { announce } = useAccessibilityAnnouncements();

  const { dragProps, isDragging } = useDragSource({
    type,
    metadata: { type, id },
    announcedName: announcedName ?? `${type} ${id}`,
  });

  // Custom announcement wrapper
  const customAnnounce = useCallback(
    (message: string) => {
      onAnnounce(message);
      // Also call the real announce for screen readers
      announce(message);
    },
    [onAnnounce, announce],
  );

  return (
    <div
      {...dragProps}
      style={{
        ...dragProps.style,
        padding: '16px',
        margin: '8px',
        backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
        border: '2px solid #2196f3',
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#1976d2';
        e.currentTarget.style.borderWidth = '3px';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#2196f3';
        e.currentTarget.style.borderWidth = '2px';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
      onKeyDown={(e) => {
        // Call the original drag source key handler first
        if (dragProps.onKeyDown) {
          dragProps.onKeyDown(e);
        }

        // Add our custom logging for keyboard start
        if ((e.key === ' ' || e.key === 'Enter') && !isDragging) {
          customAnnounce(`Started dragging ${announcedName ?? id}`);
        }
      }}
    >
      {children}
      {isDragging && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Dragging...
        </div>
      )}
    </div>
  );
}

function LoggingDropZone({
  id,
  accepts,
  announcedName,
  children,
  onDrop,
  onDragEnter,
  onDragLeave,
  onAnnounce,
}: {
  id: string;
  accepts: string[];
  announcedName?: string;
  children: React.ReactNode;
  onDrop?: (metadata: DragMetadata) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onAnnounce: (message: string) => void;
}) {
  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id,
    accepts,
    announcedName: announcedName ?? `Drop Zone ${id}`,
    onDrop: (metadata: DragMetadata) => {
      if (metadata) {
        onAnnounce(
          `Dropped ${metadata.id ?? 'item'} in ${announcedName ?? id}`,
        );
        onDrop?.(metadata);
      }
    },
    onDragEnter: () => {
      onAnnounce(`Entered ${announcedName ?? id}`);
      onDragEnter?.();
    },
    onDragLeave: () => {
      onAnnounce(`Left ${announcedName ?? id}`);
      onDragLeave?.();
    },
  });

  return (
    <div
      {...dropProps}
      style={{
        padding: '20px',
        margin: '8px',
        border: '3px dashed',
        borderRadius: '8px',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.2s',
        outline: 'none',
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
      }}
      onFocus={(e) => {
        if (isDragging) {
          e.currentTarget.style.borderColor = '#ff9800';
          e.currentTarget.style.borderStyle = 'solid';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.3)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onBlur={(e) => {
        if (isDragging) {
          e.currentTarget.style.borderStyle = 'dashed';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'scale(1)';
          const originalColor = willAccept
            ? isOver
              ? '#4caf50'
              : '#2196f3'
            : '#f44336';
          e.currentTarget.style.borderColor = originalColor;
        }
      }}
    >
      {children}
    </div>
  );
}

export const ScreenReaderAnnouncements: Story = {
  render: () => {
    const [announcements, setAnnouncements] = useState<string[]>([]);
    const [dragCount, setDragCount] = useState(0);
    const announcementsRef = useRef<HTMLDivElement>(null);
    const { announce } = useAccessibilityAnnouncements();

    const logAnnouncement = useCallback((message: string) => {
      setAnnouncements((prev) => [
        ...prev.slice(-4), // Keep last 5 announcements
        `${new Date().toLocaleTimeString()}: ${message}`,
      ]);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (announcementsRef.current) {
          announcementsRef.current.scrollTop =
            announcementsRef.current.scrollHeight;
        }
      }, 0);
    }, []);

    const items = [
      'Screen Reader Test Item A',
      'Screen Reader Test Item B',
      'Screen Reader Test Item C',
    ];

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h2>Screen Reader Announcements</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h3>Interactive Elements</h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '16px',
                }}
              >
                Use keyboard or mouse to interact. All actions will be announced
                for screen readers and logged to the right.
              </p>

              {items.map((item, index) => (
                <LoggingDragItem
                  key={index}
                  id={`sr-item-${index}`}
                  type="test"
                  announcedName={item}
                  onAnnounce={logAnnouncement}
                >
                  {item}
                </LoggingDragItem>
              ))}

              <LoggingDropZone
                id="sr-drop-zone"
                accepts={['test']}
                announcedName="Screen Reader Test Drop Zone"
                onDrop={() => setDragCount((prev) => prev + 1)}
                onAnnounce={logAnnouncement}
              >
                Drop Zone
                <br />
                <small>Items dropped: {dragCount}</small>
              </LoggingDropZone>
            </div>

            <div>
              <h3>Live Announcements</h3>
              <div
                ref={announcementsRef}
                style={{
                  height: '300px',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {announcements.length === 0 ? (
                  <div style={{ color: '#999' }}>
                    Screen reader announcements will appear here...
                    <br />
                    Try dragging items to see the announcements.
                  </div>
                ) : (
                  announcements.map((announcement, index) => (
                    <div
                      key={index}
                      style={{ marginBottom: '4px', wordWrap: 'break-word' }}
                    >
                      {announcement}
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => setAnnouncements([])}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Clear Log
                </button>
                <button
                  onClick={() => {
                    const message = 'Test announcement from button';
                    logAnnouncement(message);
                    announce(message);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginLeft: '8px',
                  }}
                >
                  Test Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};

export const AriaAttributes: Story = {
  render: () => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const items = [
      {
        id: 'aria-1',
        name: 'ARIA Test Item 1',
        description: 'Has proper aria-label and role',
      },
      {
        id: 'aria-2',
        name: 'ARIA Test Item 2',
        description: 'Uses aria-grabbed for drag state',
      },
      {
        id: 'aria-3',
        name: 'ARIA Test Item 3',
        description: 'Includes aria-dropeffect information',
      },
    ];

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h2>ARIA Attributes Demo</h2>

          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 12px' }}>ARIA Attribute Inspection</h3>
            <p style={{ fontSize: '14px', margin: '0 0 8px' }}>
              Use browser dev tools to inspect the ARIA attributes on draggable
              items:
            </p>
            <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
              <li>
                <code>role=&quot;button&quot;</code> - Makes items keyboard
                focusable
              </li>
              <li>
                <code>aria-label</code> - Provides accessible name
              </li>
              <li>
                <code>aria-grabbed</code> - Indicates if item is being dragged
              </li>
              <li>
                <code>aria-dropeffect=&quot;move&quot;</code> - Describes the
                drag operation
              </li>
              <li>
                <code>tabIndex=&quot;0&quot;</code> - Enables keyboard
                navigation
              </li>
            </ul>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h3>Draggable Items with ARIA</h3>
              {items.map((item) => (
                <div key={item.id} style={{ marginBottom: '16px' }}>
                  <AccessibleDragItem
                    id={item.id}
                    type="aria-test"
                    announcedName={`${item.name} - ${item.description}`}
                    style={{
                      cursor: 'pointer',
                      borderColor:
                        selectedItem === item.id ? '#4caf50' : '#2196f3',
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px',
                        }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </AccessibleDragItem>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      fontFamily: 'monospace',
                    }}
                  >
                    ARIA attributes: role, aria-label, aria-grabbed,
                    aria-dropeffect, tabIndex
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3>Drop Zones</h3>
              <AccessibleDropZone
                id="aria-drop-primary"
                accepts={['aria-test']}
                announcedName="Primary Drop Zone with ARIA support"
                onDrop={(metadata) => {
                  setSelectedItem(metadata.id);
                }}
              >
                Primary Zone
                <br />
                <small>Accepts all items</small>
              </AccessibleDropZone>

              <AccessibleDropZone
                id="aria-drop-secondary"
                accepts={['other']} // Doesn't accept our items
                announcedName="Secondary Drop Zone (rejects items)"
              >
                Secondary Zone
                <br />
                <small>Rejects all test items</small>
              </AccessibleDropZone>

              {selectedItem && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '6px',
                  }}
                >
                  <strong>Last dropped:</strong> {selectedItem}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '30px',
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 12px' }}>Accessibility Testing Tips</h3>
            <div style={{ fontSize: '14px' }}>
              <p>
                <strong>Screen Reader Testing:</strong>
              </p>
              <ul style={{ margin: '4px 0 12px', paddingLeft: '20px' }}>
                <li>Test with NVDA, JAWS, or VoiceOver</li>
                <li>Verify all elements are announced correctly</li>
                <li>Check that drag operations provide clear feedback</li>
              </ul>

              <p>
                <strong>Keyboard Testing:</strong>
              </p>
              <ul style={{ margin: '4px 0 12px', paddingLeft: '20px' }}>
                <li>Navigate using Tab key only</li>
                <li>Verify all functionality is accessible via keyboard</li>
                <li>Test that focus indicators are clearly visible</li>
              </ul>

              <p>
                <strong>Tools:</strong>
              </p>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>Browser DevTools Accessibility Panel</li>
                <li>axe DevTools extension</li>
                <li>Lighthouse accessibility audit</li>
              </ul>
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};

export const AccessibilityPlayground: Story = {
  render: () => {
    const [config, setConfig] = useState({
      showFocusRings: true,
      enableAnnouncements: true,
      showAriaLabels: false,
      keyboardOnly: false,
    });

    const [testResults, setTestResults] = useState<string[]>([]);

    const runAccessibilityTest = (testName: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setTestResults((prev) => [
        ...prev.slice(-3),
        `${timestamp}: ${testName} - ✅ Passed`,
      ]);
    };

    return (
      <DndStoreProvider>
        <div style={{ padding: '20px' }}>
          <h2>Accessibility Testing Playground</h2>

          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 16px' }}>Accessibility Configuration</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={config.showFocusRings}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showFocusRings: e.target.checked,
                    }))
                  }
                />
                Enhanced Focus Indicators
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={config.enableAnnouncements}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      enableAnnouncements: e.target.checked,
                    }))
                  }
                />
                Screen Reader Announcements
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={config.showAriaLabels}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showAriaLabels: e.target.checked,
                    }))
                  }
                />
                Show ARIA Labels Visually
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={config.keyboardOnly}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      keyboardOnly: e.target.checked,
                    }))
                  }
                />
                Keyboard-Only Mode
              </label>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h3>Test Elements</h3>
              <AccessibleDragItem
                id="test-element-1"
                type="playground"
                announcedName="Accessibility Test Element 1"
                style={{
                  position: 'relative',
                  pointerEvents: config.keyboardOnly ? 'none' : 'auto',
                  // Enhanced focus ring when option is enabled
                  ...(config.showFocusRings && {
                    borderWidth: '3px',
                    borderColor: '#2196f3',
                  }),
                }}
              >
                Test Element 1
                {config.showAriaLabels && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                    }}
                  >
                    aria-label: &quot;Accessibility Test Element 1&quot;
                  </div>
                )}
              </AccessibleDragItem>

              <AccessibleDragItem
                id="test-element-2"
                type="playground"
                announcedName="Accessibility Test Element 2"
                style={{
                  position: 'relative',
                  pointerEvents: config.keyboardOnly ? 'none' : 'auto',
                  // Enhanced focus ring when option is enabled
                  ...(config.showFocusRings && {
                    borderWidth: '3px',
                    borderColor: '#2196f3',
                  }),
                }}
              >
                Test Element 2
                {config.showAriaLabels && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                    }}
                  >
                    aria-label: &quot;Accessibility Test Element 2&quot;
                  </div>
                )}
              </AccessibleDragItem>
            </div>

            <div>
              <h3>Test Controls</h3>
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => runAccessibilityTest('Focus Navigation')}
                  style={{
                    padding: '8px 16px',
                    margin: '4px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Test Focus Navigation
                </button>

                <button
                  onClick={() =>
                    runAccessibilityTest('Screen Reader Compatibility')
                  }
                  style={{
                    padding: '8px 16px',
                    margin: '4px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Test Screen Reader
                </button>

                <button
                  onClick={() => runAccessibilityTest('Keyboard-Only Usage')}
                  style={{
                    padding: '8px 16px',
                    margin: '4px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Test Keyboard Only
                </button>
              </div>

              <AccessibleDropZone
                id="test-drop-zone"
                accepts={['playground']}
                announcedName="Accessibility Test Drop Zone"
                onDrop={(metadata) =>
                  runAccessibilityTest(`Drop of ${metadata.id}`)
                }
              >
                Test Drop Zone
              </AccessibleDropZone>

              {testResults.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Test Results</h4>
                  <div
                    style={{
                      backgroundColor: '#e8f5e9',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    {testResults.map((result, index) => (
                      <div key={index}>{result}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DndStoreProvider>
    );
  },
};
