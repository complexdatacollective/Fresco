/**
 * Collection Component System
 *
 * A collection component with support for:
 * - Flexible layouts (list, grid)
 * - Selection (single, multiple, none)
 * - Keyboard navigation with roving tabindex
 * - Drag and drop (optional)
 *
 * @module collection
 */

// Main component
export { Collection } from './components/Collection';
export { CollectionItem } from './components/CollectionItem';

// Provider (for advanced use cases)
export { CollectionProvider } from './CollectionProvider';

// Hooks
export {
  useCollection,
  useCollectionItem,
  useCollectionKeys,
  useCollectionSize,
} from './hooks/useCollection';

// Collection state hooks
export {
  useIsDisabled,
  useIsFocused,
  useIsSelected,
  useSelectionState,
} from './hooks/useSelectionState';

// Item interaction hooks
export { useSelectableItem } from './hooks/useSelectableItem';

// Context hooks (for advanced use cases)
export {
  useCollectionId,
  useCollectionItemContext,
  useCollectionStore,
  useCollectionStoreApi,
  useOptionalSelectionManager,
  useSelectionManager,
} from './contexts';

// Selection utilities
export {
  createSelection,
  Selection,
  selectionToSet,
} from './selection/Selection';

// Selection manager
export { SelectionManager } from './selection/SelectionManager';

// Keyboard navigation
export {
  ListKeyboardDelegate,
  useSelectableCollection,
  type KeyboardDelegate,
  type UseSelectableCollectionOptions,
  type UseSelectableCollectionResult,
} from './keyboard';

// Types
export type {
  Collection as CollectionType,
  CollectionProps,
  CollectionState,
  ItemProps,
  ItemRenderer,
  ItemRenderState,
  Key,
  KeyExtractor,
  Node,
  NodeType,
  SelectionMode,
  TextValueExtractor,
} from './types';

// Selection types
export type {
  DisabledBehavior,
  FocusStrategy,
  SelectableItemResult,
  SelectionBehavior,
  SelectionProps,
  SelectionState,
} from './selection/types';

// Store types (for advanced use cases)
export type { CollectionStoreApi } from './store';

// Layout system
export {
  GridLayout,
  type GridLayoutOptions,
  InlineGridLayout,
  type InlineGridLayoutOptions,
  Layout,
  ListLayout,
  type ListLayoutOptions,
} from './layout';
export type { LayoutInfo, LayoutOptions, Rect, Size } from './layout';

// Drag and drop integration (optional)
export {
  DropIndicator,
  useCollectionItemDropTarget,
  useDragAndDrop,
  type DropIndicatorProps,
} from './dnd';
export type {
  DragAndDropOptions,
  DragItem,
  DropPosition,
  DropTarget,
  ReorderEvent,
} from './dnd';
