import type React from 'react';

/**
 * Unique identifier for items in a collection.
 * Duplicated here to avoid circular dependency with ../types.ts
 */
type Key = string | number;

/**
 * Position where an item can be dropped relative to another item.
 * - 'before': Insert before the target item
 * - 'after': Insert after the target item
 * - 'on': Drop onto the item (for nested structures)
 */
export type DropPosition = 'before' | 'after' | 'on';

/**
 * Describes where an item should be dropped in the collection.
 */
export type DropTarget = {
  /** Key of the target item */
  key: Key;
  /** Position relative to the target */
  position: DropPosition;
};

/**
 * Represents a dragged item in the collection.
 */
export type DragItem = {
  /** Type identifier for the drag operation */
  type: string;
  /** Set of keys being dragged (supports multi-select) */
  keys: Set<Key>;
};

/**
 * Event fired when items are reordered via drag and drop.
 */
export type ReorderEvent = {
  /** Keys of items being moved */
  keys: Set<Key>;
  /** Target location for the drop */
  target: DropTarget;
};

/**
 * Event fired when items are dropped onto a collection container.
 */
export type DropEvent = {
  /** Type identifier of the dragged items */
  type: string;
  /** Full metadata from the drag source */
  metadata: Record<string, unknown>;
};

/**
 * Drop state for collection container styling.
 */
export type DroppableCollectionState = {
  /** Whether a drag item is currently over the collection container */
  isOver: boolean;
  /** Whether the current drag item would be accepted by this collection */
  willAccept: boolean;
  /** Whether any drag is in progress */
  isDragging: boolean;
};

/**
 * Full result from useDroppableCollectionState including props for the container.
 */
export type DroppableCollectionResult = {
  /** State values for styling */
  state: DroppableCollectionState;
  /** Props to spread onto the container element */
  dropProps: Record<string, unknown>;
};

/**
 * Props returned by useDraggableItemProps hook.
 * Note: isDragging is not included as it's not a valid DOM attribute.
 * Use the data-dragging attribute for styling instead.
 */
export type DraggableItemProps = {
  'ref': (el: HTMLElement | null) => void;
  'onPointerDown': (e: React.PointerEvent) => void;
  'onKeyDown': (e: React.KeyboardEvent) => void;
  'role'?: string;
  'tabIndex'?: number;
  'aria-grabbed'?: boolean;
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
  'aria-label'?: string;
  'style'?: React.CSSProperties;
  'data-dragging'?: true;
};

/**
 * Props returned by useDroppableItemProps hook.
 */
export type DroppableItemProps = {
  'ref': (el: HTMLElement | null) => void;
  'onPointerMove': (e: React.PointerEvent) => void;
  'isOver': boolean;
  'willAccept': boolean;
  'dropPosition': DropPosition | null;
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
  'aria-label'?: string;
  'data-zone-id'?: string;
  'tabIndex'?: number;
};

/**
 * Hooks injected into Collection to enable drag and drop.
 * This pattern keeps DnD logic external and optional.
 */
export type DragAndDropHooks = {
  /** Hook called for each item to get draggable props */
  useDraggableItemProps?: (key: Key) => DraggableItemProps;
  /** Hook called for each item to get droppable props (for reordering) */
  useDroppableItemProps?: (
    key: Key,
    collectionId: string,
  ) => DroppableItemProps;
  /** Hook called to get droppable state and props for the collection container */
  useDroppableCollectionState?: (
    collectionId: string,
  ) => DroppableCollectionResult;
  /** Render function for drop indicators */
  renderDropIndicator?: (target: {
    key: Key;
    position: string;
  }) => React.ReactNode;
  /** Get the current drop target */
  getDropTarget?: () => DropTarget | null;
};

/**
 * Configuration for drag and drop behavior in a collection.
 *
 * Behavior is determined by which callbacks are provided:
 * - onDrop only: Collection container becomes a drop zone
 * - onReorder only: Individual items become drop targets for reordering
 * - Both: Items for positioning, container for receiving from other collections
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type DragAndDropOptions<_T = unknown> = {
  /** Function to create drag items from selected keys */
  getItems: (keys: Set<Key>) => DragItem[];
  /** Callback when items are reordered within the collection (enables item-level drop targets) */
  onReorder?: (e: ReorderEvent) => void;
  /** Callback when items are dropped onto the collection container (enables collection-level drop zone) */
  onDrop?: (e: DropEvent) => void;
  /** Types accepted for collection-level drop (defaults to types from getItems) */
  acceptTypes?: string[];
  /** Which drop positions are allowed for reordering (default: ['before', 'after']) */
  allowedDropPositions?: DropPosition[];
  /** Additional data to include with drag operations */
  getItemMetadata?: (key: Key) => Record<string, unknown>;
  /** Name for accessibility announcements */
  announcedName: string;
};
