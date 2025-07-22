import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { DndStoreProvider } from '../lib/dnd/DndStoreProvider';
import { useDragSource } from '../lib/dnd/useDragSource';
import { useDropTarget } from '../lib/dnd/useDropTarget';
import { type DragMetadata } from '../lib/dnd/types';
import { announce } from '../lib/dnd/accessibility';

/**
 * Comprehensive drag-and-drop system demonstration.
 *
 * This story showcases the complete drag-and-drop system, including:
 * - useDragSource hook for draggable elements
 * - useDropTarget hook for drop zones
 * - DragPreview component for visual feedback
 * - Keyboard navigation and accessibility features
 * - Multiple real-world use cases
 */

// ===== Type Definitions =====
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  icon?: string;
}

interface FormComponent {
  id: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date';
  label: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'weapon' | 'armor' | 'consumable' | 'misc';
  quantity: number;
  icon?: string;
}

// ===== Shared Components =====

// Container that includes DndStoreProvider
function DndContainer({ children }: { children: React.ReactNode }) {
  return (
    <DndStoreProvider>
      <div style={{ minHeight: '500px', position: 'relative' }}>{children}</div>
    </DndStoreProvider>
  );
}

// ===== Kanban Board Components =====

function KanbanCard({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate?: (task: Task, newStatus: Task['status']) => void;
}) {
  const { dragProps, isDragging } = useDragSource({
    type: 'task',
    metadata: {
      type: 'task',
      id: task.id,
      sourceZone: task.status,
      task,
    },
    announcedName: `Task: ${task.title}`,
    preview: (
      <div
        style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '250px',
          transform: 'rotate(-2deg)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {task.description}
          </div>
        )}
      </div>
    ),
  });

  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
  };

  return (
    <div
      {...dragProps}
      style={{
        ...dragProps.style,
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: isDragging ? '#f5f5f5' : '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px' }}>{task.title}</h4>
        {task.priority && (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: priorityColors[task.priority],
              color: 'white',
            }}
          >
            {task.priority}
          </span>
        )}
      </div>
      {task.description && (
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
          {task.description}
        </p>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  title,
  tasks,
  onTaskDrop,
}: {
  status: Task['status'];
  title: string;
  tasks: Task[];
  onTaskDrop?: (taskId: string, newStatus: Task['status']) => void;
}) {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `kanban-column-${status}`,
    accepts: ['task'],
    announcedName: `${title} Column`,
    onDrop: (metadata) => {
      const taskMetadata = metadata as any;
      if (
        taskMetadata?.id &&
        taskMetadata.sourceZone !== status &&
        onTaskDrop
      ) {
        onTaskDrop(taskMetadata.id, status);
      }
    },
  });

  return (
    <div
      {...dropProps}
      style={{
        ...dropProps.style,
        flex: 1,
        minWidth: '250px',
        backgroundColor: isOver && willAccept ? '#f0f8ff' : '#f5f5f5',
        border: `2px solid ${isOver && willAccept ? '#2196f3' : '#e0e0e0'}`,
        borderRadius: '8px',
        padding: '16px',
        transition: 'all 0.2s',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#333' }}>
        {title} ({tasks.length})
      </h3>
      <div style={{ minHeight: '100px' }}>
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onUpdate={(t, newStatus) => onTaskDrop?.(t.id, newStatus)}
          />
        ))}
        {tasks.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
            }}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// ===== File Manager Components =====

function FileIcon({ type, name }: { type: 'file' | 'folder'; name: string }) {
  const icons = {
    folder: '📁',
    file: '📄',
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📝',
  };

  let icon = icons[type];
  if (type === 'file') {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'png', 'gif', 'svg'].includes(ext || '')) icon = icons.image;
    if (['mp4', 'avi', 'mov'].includes(ext || '')) icon = icons.video;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) icon = icons.audio;
    if (['doc', 'docx', 'pdf', 'txt'].includes(ext || ''))
      icon = icons.document;
  }

  return <span style={{ fontSize: '24px', marginRight: '8px' }}>{icon}</span>;
}

function FileItem({
  file,
  onMove,
}: {
  file: FileItem;
  onMove?: (fileId: string, targetFolderId: string) => void;
}) {
  const { dragProps, isDragging } = useDragSource({
    type: file.type,
    metadata: {
      type: file.type,
      id: file.id,
      name: file.name,
    },
    announcedName: `${file.type === 'folder' ? 'Folder' : 'File'}: ${file.name}`,
    preview: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: 'white',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <FileIcon type={file.type} name={file.name} />
        <span style={{ fontSize: '14px' }}>{file.name}</span>
      </div>
    ),
  });

  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `file-${file.id}`,
    accepts: file.type === 'folder' ? ['file'] : [],
    announcedName: `Folder: ${file.name}`,
    onDrop: (metadata) => {
      const fileMetadata = metadata as any;
      if (fileMetadata?.id && onMove) {
        onMove(fileMetadata.id, file.id);
      }
    },
  });

  const combinedProps =
    file.type === 'folder' ? { ...dragProps, ...dropProps } : dragProps;
  const isDropTarget = file.type === 'folder' && isOver && willAccept;

  return (
    <div
      {...combinedProps}
      style={{
        ...combinedProps.style,
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        margin: '4px 0',
        backgroundColor: isDropTarget
          ? '#e3f2fd'
          : isDragging
            ? '#f5f5f5'
            : 'white',
        border: `1px solid ${isDropTarget ? '#2196f3' : '#e0e0e0'}`,
        borderRadius: '4px',
        cursor: file.type === 'folder' ? 'pointer' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      <FileIcon type={file.type} name={file.name} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: file.type === 'folder' ? 'bold' : 'normal',
          }}
        >
          {file.name}
        </div>
        {file.size && (
          <div style={{ fontSize: '12px', color: '#666' }}>{file.size}</div>
        )}
      </div>
    </div>
  );
}

// ===== Form Builder Components =====

function FormComponentItem({ component }: { component: FormComponent }) {
  const { dragProps, isDragging } = useDragSource({
    type: 'form-component',
    metadata: {
      type: 'form-component',
      componentType: component.type,
      id: component.id,
      label: component.label,
    },
    announcedName: `Form Component: ${component.label}`,
    preview: (
      <div
        style={{
          padding: '8px 16px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        + {component.label}
      </div>
    ),
  });

  const componentIcons: Record<FormComponent['type'], string> = {
    text: '📝',
    number: '🔢',
    select: '📋',
    checkbox: '☑️',
    date: '📅',
  };

  return (
    <div
      {...dragProps}
      style={{
        ...dragProps.style,
        padding: '12px',
        margin: '4px',
        backgroundColor: isDragging ? '#f5f5f5' : 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '20px' }}>{componentIcons[component.type]}</span>
      <span style={{ fontSize: '14px' }}>{component.label}</span>
    </div>
  );
}

function FormCanvas({
  components,
  onComponentAdd,
}: {
  components: FormComponent[];
  onComponentAdd?: (component: FormComponent) => void;
}) {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'form-canvas',
    accepts: ['form-component'],
    announcedName: 'Form Canvas',
    onDrop: (metadata) => {
      const componentMetadata = metadata as any;
      if (componentMetadata?.componentType && onComponentAdd) {
        onComponentAdd({
          id: `field-${Date.now()}`,
          type: componentMetadata.componentType,
          label: componentMetadata.label || 'New Field',
        });
      }
    },
  });

  return (
    <div
      {...dropProps}
      style={{
        ...dropProps.style,
        minHeight: '400px',
        padding: '20px',
        backgroundColor: isOver && willAccept ? '#f0f8ff' : 'white',
        border: `2px dashed ${isOver && willAccept ? '#2196f3' : '#e0e0e0'}`,
        borderRadius: '8px',
        transition: 'all 0.2s',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#666' }}>
        Form Preview
      </h3>
      {components.map((component, index) => (
        <div key={component.id} style={{ marginBottom: '16px' }}>
          <label
            style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}
          >
            {component.label}
          </label>
          {component.type === 'text' && (
            <input
              type="text"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          )}
          {component.type === 'number' && (
            <input
              type="number"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          )}
          {component.type === 'select' && (
            <select
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          )}
          {component.type === 'checkbox' && (
            <input type="checkbox" style={{ marginRight: '8px' }} />
          )}
          {component.type === 'date' && (
            <input
              type="date"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          )}
        </div>
      ))}
      {components.length === 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
          }}
        >
          Drag form components here to build your form
        </div>
      )}
    </div>
  );
}

// ===== Inventory System Components =====

function InventorySlot({
  item,
  category,
  onItemMove,
}: {
  item?: InventoryItem;
  category: InventoryItem['category'];
  onItemMove?: (
    item: InventoryItem,
    targetCategory: InventoryItem['category'],
  ) => void;
}) {
  const { dragProps, isDragging } = useDragSource({
    type: item ? 'inventory-item' : 'empty-slot',
    metadata: item
      ? {
          type: 'inventory-item',
          id: item.id,
          item,
          sourceCategory: item.category,
        }
      : { type: 'empty-slot' },
    announcedName: item ? `Item: ${item.name}` : 'Empty slot',
    preview: item ? (
      <div
        style={{
          padding: '8px',
          backgroundColor: '#333',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '20px' }}>{item.icon || '📦'}</span>
        <div>
          <div>{item.name}</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>x{item.quantity}</div>
        </div>
      </div>
    ) : null,
    disabled: !item,
  });

  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `slot-${category}-${item?.id || 'empty'}`,
    accepts: ['inventory-item'],
    announcedName: `${category} slot`,
    onDrop: (metadata) => {
      const itemMetadata = metadata as any;
      if (itemMetadata?.item && onItemMove) {
        onItemMove(itemMetadata.item, category);
      }
    },
  });

  const combinedProps = item ? { ...dragProps, ...dropProps } : dropProps;

  return (
    <div
      {...combinedProps}
      style={{
        ...combinedProps.style,
        width: '80px',
        height: '80px',
        backgroundColor: isOver && willAccept ? '#e8f5e9' : '#f5f5f5',
        border: `2px solid ${isOver && willAccept ? '#4caf50' : '#ddd'}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {item ? (
        <>
          <span style={{ fontSize: '32px' }}>{item.icon || '📦'}</span>
          <span style={{ fontSize: '10px', marginTop: '4px' }}>
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                backgroundColor: '#333',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {item.quantity}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: '12px', color: '#999' }}>Empty</span>
      )}
    </div>
  );
}

// ===== Keyboard Navigation Demo Component =====

function KeyboardNavigationDemo() {
  const [items, setItems] = useState([
    { id: '1', name: 'Item A', zone: 'source' },
    { id: '2', name: 'Item B', zone: 'source' },
    { id: '3', name: 'Item C', zone: 'source' },
  ]);
  const [lastAction, setLastAction] = useState('');
  const [keyboardInstructions, setKeyboardInstructions] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#e8eaf6',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px' }}>Keyboard Navigation Test</h3>
        <button
          onClick={() => setKeyboardInstructions(!keyboardInstructions)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3f51b5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          {keyboardInstructions ? 'Hide' : 'Show'} Instructions
        </button>
        {keyboardInstructions && (
          <div style={{ fontSize: '14px' }}>
            <h4>Keyboard Controls:</h4>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <kbd>Tab</kbd> - Navigate between draggable items
              </li>
              <li>
                <kbd>Space</kbd> or <kbd>Enter</kbd> - Start dragging focused
                item
              </li>
              <li>
                <kbd>Arrow Keys</kbd> - Navigate between drop zones while
                dragging
              </li>
              <li>
                <kbd>Space</kbd> or <kbd>Enter</kbd> - Drop item in current zone
              </li>
              <li>
                <kbd>Escape</kbd> - Cancel drag operation
              </li>
            </ul>
            <p>
              <strong>Screen Reader:</strong> Full announcements for all drag
              operations
            </p>
          </div>
        )}
        <div style={{ fontSize: '14px', color: '#666' }}>
          Last Action: <strong>{lastAction || 'None'}</strong>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <div>
          <h4>Source Items</h4>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              minHeight: '200px',
            }}
          >
            {items
              .filter((item) => item.zone === 'source')
              .map((item) => {
                const { dragProps, isDragging } = useDragSource({
                  type: 'keyboard-item',
                  metadata: {
                    type: 'keyboard-item',
                    id: item.id,
                    name: item.name,
                    sourceZone: 'source',
                  },
                  announcedName: item.name,
                });

                return (
                  <div
                    key={item.id}
                    {...dragProps}
                    style={{
                      ...dragProps.style,
                      padding: '12px',
                      margin: '8px 0',
                      backgroundColor: isDragging ? '#e3f2fd' : 'white',
                      border: '2px solid #2196f3',
                      borderRadius: '6px',
                      opacity: isDragging ? 0.5 : 1,
                    }}
                  >
                    {item.name}
                    {isDragging && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        (Dragging...)
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div>
          <h4>Target Zone</h4>
          <div
            {...useDropTarget({
              id: 'keyboard-target',
              accepts: ['keyboard-item'],
              announcedName: 'Target Drop Zone',
              onDrop: (metadata) => {
                announce('Item dropped successfully');
              },
            }).dropProps}
            style={{
              padding: '16px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              minHeight: '200px',
              border: '2px dashed #4caf50',
            }}
          >
            {items
              .filter((item) => item.zone === 'target')
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: 'white',
                    border: '1px solid #4caf50',
                    borderRadius: '6px',
                  }}
                >
                  {item.name}
                </div>
              ))}
            {items.filter((item) => item.zone === 'target').length === 0 && (
              <div
                style={{
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '40px',
                }}
              >
                Drop items here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Multiple Drag Contexts Demo =====

function MultipleDragContextsDemo() {
  const [context1Items, setContext1Items] = useState(['A1', 'A2', 'A3']);
  const [context2Items, setContext2Items] = useState(['B1', 'B2', 'B3']);
  const [sharedZone, setSharedZone] = useState<string[]>([]);

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Multiple Drag Contexts</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
        }}
      >
        <div>
          <h4 style={{ color: '#2196f3' }}>Context A (Blue Items)</h4>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              minHeight: '200px',
            }}
          >
            {context1Items.map((item) => {
              const { dragProps, isDragging } = useDragSource({
                type: 'context-a',
                metadata: {
                  type: 'context-a',
                  id: item,
                  sourceContext: 'context1',
                },
                announcedName: `Blue ${item}`,
                preview: (
                  <div
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    🔵 {item}
                  </div>
                ),
              });

              return (
                <div
                  key={item}
                  {...dragProps}
                  style={{
                    ...dragProps.style,
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: isDragging ? '#bbdefb' : '#2196f3',
                    color: 'white',
                    borderRadius: '6px',
                    textAlign: 'center',
                    opacity: isDragging ? 0.5 : 1,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#f44336' }}>Context B (Red Items)</h4>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              minHeight: '200px',
            }}
          >
            {context2Items.map((item) => {
              const { dragProps, isDragging } = useDragSource({
                type: 'context-b',
                metadata: {
                  type: 'context-b',
                  id: item,
                  sourceContext: 'context2',
                },
                announcedName: `Red ${item}`,
                preview: (
                  <div
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    🔴 {item}
                  </div>
                ),
              });

              return (
                <div
                  key={item}
                  {...dragProps}
                  style={{
                    ...dragProps.style,
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: isDragging ? '#ffcdd2' : '#f44336',
                    color: 'white',
                    borderRadius: '6px',
                    textAlign: 'center',
                    opacity: isDragging ? 0.5 : 1,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#4caf50' }}>Shared Zone (Accepts Both)</h4>
          <div
            {...useDropTarget({
              id: 'shared-drop-zone',
              accepts: ['context-a', 'context-b'],
              announcedName: 'Shared Drop Zone',
              onDrop: (metadata) => {
                const meta = metadata as any;
                setSharedZone((prev) => [...prev, meta?.id]);
                if (meta?.sourceContext === 'context1') {
                  setContext1Items((prev) =>
                    prev.filter((item) => item !== meta.id),
                  );
                } else {
                  setContext2Items((prev) =>
                    prev.filter((item) => item !== meta.id),
                  );
                }
              },
            }).dropProps}
            style={{
              padding: '16px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              minHeight: '200px',
              border: '2px dashed #4caf50',
            }}
          >
            {sharedZone.map((item) => (
              <div
                key={item}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  backgroundColor: item.startsWith('A') ? '#2196f3' : '#f44336',
                  color: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                {item}
              </div>
            ))}
            {sharedZone.length === 0 && (
              <div
                style={{
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '40px',
                }}
              >
                Drop items from either context
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Advanced Constraints Demo =====

function AdvancedConstraintsDemo() {
  const [items, setItems] = useState([
    { id: '1', value: 5, color: 'red' },
    { id: '2', value: 10, color: 'blue' },
    { id: '3', value: 15, color: 'green' },
    { id: '4', value: 20, color: 'red' },
    { id: '5', value: 25, color: 'blue' },
  ]);
  const [zone1Items, setZone1Items] = useState<typeof items>([]);
  const [zone2Items, setZone2Items] = useState<typeof items>([]);
  const [zone3Items, setZone3Items] = useState<typeof items>([]);

  const zone1Sum = zone1Items.reduce((sum, item) => sum + item.value, 0);
  const zone2Sum = zone2Items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>
        Advanced Validation & Constraints
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>Source Items</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {items.map((item) => {
            const { dragProps, isDragging } = useDragSource({
              type: 'constraint-item',
              metadata: {
                type: 'constraint-item',
                id: item.id,
                value: item.value,
                color: item.color,
              },
              announcedName: `Item ${item.id} (Value: ${item.value})`,
              preview: (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: item.color,
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {item.value}
                </div>
              ),
            });

            return (
              <div
                key={item.id}
                {...dragProps}
                style={{
                  ...dragProps.style,
                  width: '80px',
                  height: '80px',
                  backgroundColor: item.color,
                  color: 'white',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  opacity: isDragging ? 0.5 : 1,
                }}
              >
                {item.value}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
        }}
      >
        <div>
          <h4>Zone 1: Max Sum 30</h4>
          <div
            {...useDropTarget({
              id: 'constraint-zone-1',
              accepts: ['constraint-item'],
              announcedName: 'Zone 1 (Max 30)',
              onDrop: (metadata) => {
                const meta = metadata as any;
                const newItem = items.find((i) => i.id === meta?.id);
                if (newItem && zone1Sum + newItem.value <= 30) {
                  setZone1Items((prev) => [...prev, newItem]);
                  setItems((prev) => prev.filter((i) => i.id !== meta.id));
                } else {
                  announce('Cannot drop: Sum would exceed 30');
                }
              },
            }).dropProps}
            style={{
              padding: '16px',
              backgroundColor: zone1Sum > 30 ? '#ffebee' : '#f5f5f5',
              border: `2px solid ${zone1Sum > 30 ? '#f44336' : '#ddd'}`,
              borderRadius: '8px',
              minHeight: '150px',
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              Sum: {zone1Sum}/30
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {zone1Items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: item.color,
                    color: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4>Zone 2: Only Red & Blue</h4>
          <div
            {...useDropTarget({
              id: 'constraint-zone-2',
              accepts: ['constraint-item'],
              announcedName: 'Zone 2 (Red & Blue Only)',
              onDrop: (metadata) => {
                const meta = metadata as any;
                const newItem = items.find((i) => i.id === meta?.id);
                if (
                  newItem &&
                  (newItem.color === 'red' || newItem.color === 'blue')
                ) {
                  setZone2Items((prev) => [...prev, newItem]);
                  setItems((prev) => prev.filter((i) => i.id !== meta.id));
                } else {
                  announce('Cannot drop: Only red and blue items allowed');
                }
              },
            }).dropProps}
            style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              border: '2px solid #ddd',
              borderRadius: '8px',
              minHeight: '150px',
            }}
          >
            <div
              style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}
            >
              Only red & blue items
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {zone2Items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: item.color,
                    color: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4>Zone 3: Max 3 Items</h4>
          <div
            {...useDropTarget({
              id: 'constraint-zone-3',
              accepts: ['constraint-item'],
              announcedName: 'Zone 3 (Max 3 Items)',
              onDrop: (metadata) => {
                const meta = metadata as any;
                const newItem = items.find((i) => i.id === meta?.id);
                if (newItem && zone3Items.length < 3) {
                  setZone3Items((prev) => [...prev, newItem]);
                  setItems((prev) => prev.filter((i) => i.id !== meta.id));
                } else {
                  announce('Cannot drop: Maximum 3 items allowed');
                }
              },
            }).dropProps}
            style={{
              padding: '16px',
              backgroundColor: zone3Items.length >= 3 ? '#ffebee' : '#f5f5f5',
              border: `2px solid ${zone3Items.length >= 3 ? '#f44336' : '#ddd'}`,
              borderRadius: '8px',
              minHeight: '150px',
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              Items: {zone3Items.length}/3
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {zone3Items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: item.color,
                    color: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Story Configuration =====

const meta: Meta = {
  title: 'DnD/Complete System Demo',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Complete Drag-and-Drop System

This comprehensive demo showcases the entire drag-and-drop system working together, including:

## Core Components
- **useDragSource**: Hook for making elements draggable
- **useDropTarget**: Hook for creating drop zones
- **DragPreview**: Visual feedback component that follows the cursor

## Features Demonstrated

### 🎯 Real-World Use Cases
1. **Kanban Board**: Task management with columns and priority indicators
2. **File Manager**: Hierarchical file/folder system with type-specific icons
3. **Form Builder**: Drag-and-drop form construction
4. **Inventory System**: Game-like inventory with categorized items

### ⌨️ Accessibility
- Full keyboard navigation support
- Screen reader announcements
- ARIA attributes for all interactive elements
- Focus management during drag operations

### 🚀 Advanced Features
- Multiple drag contexts working simultaneously
- Complex validation and constraints
- Custom drag previews
- Auto-scrolling support
- Performance optimizations with BSP tree hit detection

### 🎨 Customization
- Custom preview components
- Dynamic styling based on drag state
- Configurable offsets and behaviors
- Zone-specific drop rules

## Implementation Details

The system uses:
- **Zustand** for global state management
- **Portal rendering** for drag previews
- **ResizeObserver** for dynamic sizing
- **IntersectionObserver** for visibility detection
- **RAF throttling** for performance
- **Binary Space Partitioning** for efficient hit detection

All components are fully typed with TypeScript and include comprehensive accessibility support.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ===== Stories =====

export const KanbanBoard: Story = {
  render: () => {
    const [tasks, setTasks] = useState<Task[]>([
      {
        id: '1',
        title: 'Design Homepage',
        description: 'Create mockups for the new homepage design',
        status: 'todo',
        priority: 'high',
      },
      {
        id: '2',
        title: 'Implement Authentication',
        description: 'Add user login and registration',
        status: 'todo',
        priority: 'high',
      },
      {
        id: '3',
        title: 'Write API Documentation',
        description: 'Document all REST endpoints',
        status: 'in-progress',
        priority: 'medium',
      },
      {
        id: '4',
        title: 'Setup CI/CD Pipeline',
        description: 'Configure GitHub Actions',
        status: 'in-progress',
        priority: 'low',
      },
      {
        id: '5',
        title: 'Deploy to Production',
        description: 'Release v1.0',
        status: 'done',
        priority: 'high',
      },
      {
        id: '6',
        title: 'User Testing',
        description: 'Conduct usability testing sessions',
        status: 'todo',
        priority: 'medium',
      },
    ]);

    const handleTaskMove = useCallback(
      (taskId: string, newStatus: Task['status']) => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task,
          ),
        );
      },
      [],
    );

    const columns: Array<{ status: Task['status']; title: string }> = [
      { status: 'todo', title: 'To Do' },
      { status: 'in-progress', title: 'In Progress' },
      { status: 'done', title: 'Done' },
    ];

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>Kanban Board Demo</h2>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={tasks.filter((task) => task.status === column.status)}
                onTaskDrop={handleTaskMove}
              />
            ))}
          </div>
        </div>
      </DndContainer>
    );
  },
};

export const FileManager: Story = {
  render: () => {
    const [files, setFiles] = useState<FileItem[]>([
      { id: '1', name: 'Documents', type: 'folder' },
      { id: '2', name: 'Images', type: 'folder' },
      { id: '3', name: 'Videos', type: 'folder' },
      { id: '4', name: 'report.pdf', type: 'file', size: '2.4 MB' },
      { id: '5', name: 'presentation.pptx', type: 'file', size: '5.1 MB' },
      { id: '6', name: 'photo.jpg', type: 'file', size: '1.2 MB' },
      { id: '7', name: 'video.mp4', type: 'file', size: '45.3 MB' },
      { id: '8', name: 'music.mp3', type: 'file', size: '3.8 MB' },
    ]);

    const handleFileMove = useCallback(
      (fileId: string, targetFolderId: string) => {
        const file = files.find((f) => f.id === fileId);
        const folder = files.find((f) => f.id === targetFolderId);
        if (file && folder && folder.type === 'folder') {
          announce(`Moved ${file.name} to ${folder.name}`);
        }
      },
      [files],
    );

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>File Manager Demo</h2>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>My Files</h3>
            <div>
              {files.map((file) => (
                <FileItem key={file.id} file={file} onMove={handleFileMove} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <strong>Tip:</strong> Drag files into folders to organize them
          </div>
        </div>
      </DndContainer>
    );
  },
};

export const FormBuilder: Story = {
  render: () => {
    const [availableComponents] = useState<FormComponent[]>([
      { id: 'comp-1', type: 'text', label: 'Text Input' },
      { id: 'comp-2', type: 'number', label: 'Number Input' },
      { id: 'comp-3', type: 'select', label: 'Dropdown' },
      { id: 'comp-4', type: 'checkbox', label: 'Checkbox' },
      { id: 'comp-5', type: 'date', label: 'Date Picker' },
    ]);
    const [formComponents, setFormComponents] = useState<FormComponent[]>([]);

    const handleComponentAdd = useCallback((component: FormComponent) => {
      setFormComponents((prev) => [...prev, component]);
      announce(`Added ${component.label} to form`);
    }, []);

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>Form Builder Demo</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                Available Components
              </h3>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                {availableComponents.map((component) => (
                  <FormComponentItem key={component.id} component={component} />
                ))}
              </div>
            </div>
            <div>
              <FormCanvas
                components={formComponents}
                onComponentAdd={handleComponentAdd}
              />
            </div>
          </div>
        </div>
      </DndContainer>
    );
  },
};

export const InventorySystem: Story = {
  render: () => {
    const [items] = useState<InventoryItem[]>([
      { id: '1', name: 'Sword', category: 'weapon', quantity: 1, icon: '⚔️' },
      { id: '2', name: 'Shield', category: 'armor', quantity: 1, icon: '🛡️' },
      {
        id: '3',
        name: 'Potion',
        category: 'consumable',
        quantity: 5,
        icon: '🧪',
      },
      { id: '4', name: 'Helmet', category: 'armor', quantity: 1, icon: '🪖' },
      { id: '5', name: 'Scroll', category: 'misc', quantity: 3, icon: '📜' },
    ]);
    const [inventory, setInventory] = useState<
      Record<string, InventoryItem | undefined>
    >({
      weapon1: items[0],
      armor1: items[1],
      consumable1: items[2],
      misc1: undefined,
    });

    const handleItemMove = useCallback(
      (item: InventoryItem, targetCategory: InventoryItem['category']) => {
        announce(`Moved ${item.name} to ${targetCategory} slot`);
      },
      [],
    );

    const categories: InventoryItem['category'][] = [
      'weapon',
      'armor',
      'consumable',
      'misc',
    ];

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>Inventory System Demo</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              maxWidth: '800px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                Available Items
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {items.map((item) => (
                  <InventorySlot
                    key={item.id}
                    item={item}
                    category={item.category}
                    onItemMove={handleItemMove}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                Equipment Slots
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                }}
              >
                {categories.map((category, index) => (
                  <div key={category}>
                    <div
                      style={{
                        fontSize: '12px',
                        marginBottom: '4px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {category}
                    </div>
                    <InventorySlot
                      item={inventory[`${category}${index + 1}`]}
                      category={category}
                      onItemMove={handleItemMove}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DndContainer>
    );
  },
};

export const KeyboardNavigation: Story = {
  render: () => (
    <DndContainer>
      <KeyboardNavigationDemo />
    </DndContainer>
  ),
};

export const AccessibilityShowcase: Story = {
  render: () => {
    const [announcements, setAnnouncements] = useState<string[]>([]);
    const announcementsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Intercept announcements for demonstration
      const originalAnnounce = (window as any).announce || announce;
      (window as any).announce = (message: string) => {
        originalAnnounce(message);
        setAnnouncements((prev) => [
          ...prev,
          `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
        setTimeout(() => {
          announcementsRef.current?.scrollTo({
            top: announcementsRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 0);
      };

      return () => {
        (window as any).announce = originalAnnounce;
      };
    }, []);

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>
            Accessibility Features Showcase
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
            }}
          >
            <div>
              <h3>Interactive Demo</h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '20px',
                }}
              >
                All drag operations announce their status for screen readers
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h4>Draggable Items</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['Document', 'Image', 'Folder'].map((type) => {
                    const { dragProps, isDragging } = useDragSource({
                      type: 'demo-item',
                      metadata: { type: 'demo-item', name: type },
                      announcedName: `${type} (accessible)`,
                    });

                    return (
                      <div
                        key={type}
                        {...dragProps}
                        style={{
                          ...dragProps.style,
                          padding: '16px 24px',
                          backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
                          border: '2px solid #2196f3',
                          borderRadius: '6px',
                          opacity: isDragging ? 0.5 : 1,
                        }}
                      >
                        {type}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4>Drop Zone</h4>
                <div
                  {...useDropTarget({
                    id: 'accessible-drop-zone',
                    accepts: ['demo-item'],
                    announcedName: 'Accessible Drop Zone',
                    onDragEnter: () => announce('Entered drop zone'),
                    onDragLeave: () => announce('Left drop zone'),
                    onDrop: (metadata) => {
                      const meta = metadata as any;
                      announce(`${meta?.name} dropped in zone`);
                    },
                  }).dropProps}
                  style={{
                    padding: '40px',
                    backgroundColor: '#e8f5e9',
                    border: '2px dashed #4caf50',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  Drop items here
                </div>
              </div>
            </div>

            <div>
              <h3>Screen Reader Announcements</h3>
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
                {announcements.length === 0 && (
                  <div style={{ color: '#999' }}>
                    Announcements will appear here...
                  </div>
                )}
                {announcements.map((announcement, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    {announcement}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAnnouncements([])}
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
                Clear
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: '30px',
              padding: '16px',
              backgroundColor: '#e8eaf6',
              borderRadius: '8px',
            }}
          >
            <h4 style={{ margin: '0 0 10px' }}>Accessibility Features:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>
                All draggable elements have <code>role="button"</code> and are
                keyboard focusable
              </li>
              <li>
                ARIA attributes: <code>aria-grabbed</code>,{' '}
                <code>aria-dropeffect</code>, <code>aria-label</code>
              </li>
              <li>Screen reader announcements for all drag operations</li>
              <li>Keyboard navigation with arrow keys during drag</li>
              <li>Clear focus indicators for keyboard users</li>
              <li>Escape key to cancel drag operations</li>
            </ul>
          </div>
        </div>
      </DndContainer>
    );
  },
};

export const MultipleDragContexts: Story = {
  render: () => (
    <DndContainer>
      <MultipleDragContextsDemo />
    </DndContainer>
  ),
};

export const AdvancedConstraints: Story = {
  render: () => (
    <DndContainer>
      <AdvancedConstraintsDemo />
    </DndContainer>
  ),
};

export const CompletePlayground: Story = {
  render: () => {
    const [config, setConfig] = useState({
      showInstructions: true,
      enableKeyboard: true,
      enableTouch: true,
    });

    return (
      <DndContainer>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>Complete System Playground</h2>

          <div
            style={{
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ margin: '0 0 16px' }}>Configuration</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666' }}>
                Preview offset is now handled automatically by the
                DndStoreProvider
              </div>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={config.showInstructions}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showInstructions: e.target.checked,
                    }))
                  }
                />
                Show Instructions
              </label>
            </div>
          </div>

          {config.showInstructions && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <h4 style={{ margin: '0 0 8px' }}>Instructions:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>
                  <strong>Mouse/Touch:</strong> Click/tap and drag items between
                  zones
                </li>
                <li>
                  <strong>Keyboard:</strong> Tab to focus, Space/Enter to pick
                  up, arrows to navigate, Space/Enter to drop
                </li>
                <li>
                  <strong>Accessibility:</strong> Full screen reader support
                  with announcements
                </li>
                <li>
                  <strong>Constraints:</strong> Some zones have specific rules
                  about what they accept
                </li>
              </ul>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <h3>Mini Kanban</h3>
              <KanbanDemo />
            </div>
            <div>
              <h3>Mini File Manager</h3>
              <FileManagerDemo />
            </div>
            <div>
              <h3>Mini Inventory</h3>
              <InventoryDemo />
            </div>
          </div>
        </div>
      </DndContainer>
    );
  },
};

// Mini demos for the playground
function KanbanDemo() {
  const [tasks, setTasks] = useState([
    { id: 'task1', status: 'todo', title: 'Task 1' },
    { id: 'task2', status: 'todo', title: 'Task 2' },
  ]);

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {['todo', 'done'].map((status) => (
        <div
          key={status}
          {...useDropTarget({
            id: `mini-task-${status}`,
            accepts: ['mini-task'],
            announcedName: `${status} column`,
            onDrop: (metadata) => {
              const meta = metadata as any;
              setTasks((prev) =>
                prev.map((t) => (t.id === meta?.id ? { ...t, status } : t)),
              );
            },
          }).dropProps}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            minHeight: '100px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            {status.toUpperCase()}
          </div>
          {tasks
            .filter((t) => t.status === status)
            .map((task) => {
              const { dragProps, isDragging } = useDragSource({
                type: 'mini-task',
                metadata: {
                  type: 'mini-task',
                  id: task.id,
                  sourceZone: task.status,
                },
                announcedName: task.title,
              });
              return (
                <div
                  key={task.id}
                  {...dragProps}
                  style={{
                    ...dragProps.style,
                    padding: '6px',
                    marginBottom: '4px',
                    backgroundColor: isDragging ? '#e3f2fd' : 'white',
                    borderRadius: '3px',
                    fontSize: '12px',
                    opacity: isDragging ? 0.5 : 1,
                  }}
                >
                  {task.title}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}

function FileManagerDemo() {
  const files = [
    { id: 'folder1', name: 'Folder', type: 'folder' as const },
    { id: 'file1', name: 'File.txt', type: 'file' as const },
    { id: 'file2', name: 'Image.jpg', type: 'file' as const },
  ];

  return (
    <div
      style={{
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px',
      }}
    >
      {files.map((file) => {
        const { dragProps, isDragging } = useDragSource({
          type: file.type,
          metadata: { type: file.type, id: file.id },
          announcedName: file.name,
        });

        const dropProps =
          file.type === 'folder'
            ? useDropTarget({
                id: `mini-folder-${file.id}`,
                accepts: ['file'],
                announcedName: `Folder: ${file.name}`,
                onDrop: (metadata) => {
                  const meta = metadata as any;
                  announce(`Moved file to ${file.name}`);
                },
              }).dropProps
            : {};

        return (
          <div
            key={file.id}
            {...dragProps}
            {...dropProps}
            style={{
              ...dragProps.style,
              padding: '6px',
              marginBottom: '4px',
              backgroundColor: isDragging ? '#e3f2fd' : 'white',
              borderRadius: '3px',
              fontSize: '12px',
              opacity: isDragging ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{file.type === 'folder' ? '📁' : '📄'}</span>
            {file.name}
          </div>
        );
      })}
    </div>
  );
}

function InventoryDemo() {
  const items = [
    { id: 'sword', name: 'Sword', icon: '⚔️' },
    { id: 'shield', name: 'Shield', icon: '🛡️' },
    { id: 'potion', name: 'Potion', icon: '🧪' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}
    >
      {items.map((item) => {
        const { dragProps, isDragging } = useDragSource({
          type: 'mini-item',
          metadata: { type: 'mini-item', id: item.id },
          announcedName: item.name,
        });

        return (
          <div
            key={item.id}
            {...dragProps}
            style={{
              ...dragProps.style,
              width: '60px',
              height: '60px',
              backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDragging ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: '24px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px' }}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}
