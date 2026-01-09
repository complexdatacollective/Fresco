import { type Key } from '../types';

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
  /** Hook called at collection level to get container DnD props */
  useDraggableCollectionProps?: () => Record<string, unknown>;
  /** Hook called for each item to get draggable props */
  useDraggableItemProps?: (key: Key) => Record<string, unknown>;
  /** Hook called for each item to get droppable props */
  useDroppableItemProps?: (
    key: Key,
    collectionId: string,
  ) => DroppableItemProps;
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
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type DragAndDropOptions<_T = unknown> = {
  /** Function to create drag items from selected keys */
  getItems: (keys: Set<Key>) => DragItem[];
  /** Callback when items are reordered */
  onReorder?: (e: ReorderEvent) => void;
  /** Which drop positions are allowed (default: all) */
  allowedDropPositions?: DropPosition[];
  /** Additional data to include with drag operations */
  getItemMetadata?: (key: Key) => Record<string, unknown>;
};
