/**
 * Core types for the Collection component system.
 *
 * Design Principles:
 * - Centralized State: All item state stored at collection level
 * - Query, Don't Store: Items query state, don't maintain local copies
 * - Set-based Lookups: O(1) operations for selection/disabled checks
 */

import { type DragAndDropHooks } from './dnd/types';
import { type FilterProps } from './filtering/types';
import { type Layout } from './layout/Layout';
import { type SortProps } from './sorting/types';

/**
 * Unique identifier for items in a collection.
 * Can be string or number to support various data sources.
 */
export type Key = string | number;

/**
 * Type of node in the collection hierarchy.
 * - 'item': Regular selectable/draggable item
 * - 'section': Group container (not selectable)
 * - 'header': Section header (not selectable)
 */
export type NodeType = 'item' | 'section' | 'header';

/**
 * Represents a single node in the collection.
 * Contains both the user's data and computed metadata.
 */
export type Node<T> = {
  /** Unique identifier for this node */
  key: Key;
  /** Type of node */
  type: NodeType;
  /** The user's data object */
  value: T;
  /** Text representation for type-ahead search and accessibility */
  textValue: string;
  /** Zero-based index in the flattened collection */
  index: number;
  /** Key of parent node (for nested structures) */
  parentKey?: Key | null;
  /** Level in the hierarchy (0 for root items) */
  level: number;
};

/**
 * Function to extract a unique key from an item.
 */
export type KeyExtractor<T> = (item: T) => Key;

/**
 * Function to extract text value for search/accessibility.
 */
export type TextValueExtractor<T> = (item: T) => string;

/**
 * Props to spread onto the rendered item element.
 * Contains accessibility attributes, event handlers, and data attributes for styling.
 * Use data attributes like data-selected:, data-focused:, etc. with Tailwind for styling.
 */
export type ItemProps = {
  'ref': React.RefCallback<HTMLElement>;
  'id'?: string;
  'tabIndex': number;
  'role': string;
  'style'?: React.CSSProperties;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  'data-collection-item'?: boolean;
  'data-selected'?: boolean;
  'data-focused'?: boolean;
  'data-disabled'?: boolean;
  'data-dragging'?: boolean;
  'data-drop-target'?: boolean;
  'onFocus'?: React.FocusEventHandler<Element>;
  'onClick'?: React.MouseEventHandler<Element>;
  'onKeyDown'?: React.KeyboardEventHandler<Element>;
  'onPointerDown'?: React.PointerEventHandler<Element>;
  'onPointerMove'?: React.PointerEventHandler<Element>;
};

/**
 * Render function for collection items.
 */
export type ItemRenderer<T> = (
  item: T,
  itemProps: ItemProps,
) => React.ReactNode;

/**
 * Core collection state managed by Zustand store.
 */
export type CollectionState<T> = {
  /** Map of all items by key for O(1) lookup */
  items: Map<Key, Node<T>>;
  /** Ordered array of keys for iteration/navigation */
  orderedKeys: Key[];
  /** Total number of items */
  size: number;
};

/**
 * Actions for mutating collection state.
 */
type CollectionActions<T> = {
  /** Set the entire items collection */
  setItems: (
    items: T[],
    keyExtractor: KeyExtractor<T>,
    textValueExtractor: TextValueExtractor<T>,
  ) => void;
  /** Get a node by key */
  getItem: (key: Key) => Node<T> | undefined;
  /** Get the key before the given key */
  getKeyBefore: (key: Key) => Key | null;
  /** Get the key after the given key */
  getKeyAfter: (key: Key) => Key | null;
  /** Get the first key in the collection */
  getFirstKey: () => Key | null;
  /** Get the last key in the collection */
  getLastKey: () => Key | null;
  /** Get all keys in order */
  getKeys: () => Key[];
};

/**
 * Combined collection store type.
 */
export type CollectionStore<T> = CollectionState<T> & CollectionActions<T>;

/**
 * Immutable interface for querying collection data.
 * Used by components to navigate and access items.
 */
export type Collection<T> = {
  /** Number of items in the collection */
  readonly size: number;
  /** Get all keys in order */
  getKeys(): Iterable<Key>;
  /** Get a node by key */
  getItem(key: Key): Node<T> | undefined;
  /** Get the first key */
  getFirstKey(): Key | null;
  /** Get the last key */
  getLastKey(): Key | null;
  /** Get the key before the given key */
  getKeyBefore(key: Key): Key | null;
  /** Get the key after the given key */
  getKeyAfter(key: Key): Key | null;
  /** Iterate over all nodes */
  [Symbol.iterator](): Iterator<Node<T>>;
};

/**
 * Selection mode determines how many items can be selected.
 */
export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * Props for the main Collection component.
 */
export type CollectionProps<T> = SortProps &
  FilterProps & {
    /** Array of items to display */
    'items': T[];
    /** Function to extract unique key from each item */
    'keyExtractor': KeyExtractor<T>;
    /** Function to render each item */
    'renderItem': ItemRenderer<T>;
    /** Layout instance that controls positioning */
    'layout': Layout<T>;
    /** Function to extract text value for type-ahead search and accessibility */
    'textValueExtractor': TextValueExtractor<T>;
    /** Component to render when collection is empty */
    'emptyState'?: React.ReactNode;
    /** Additional CSS class names */
    'className'?: string;
    /** ID for the collection element */
    'id'?: string;
    /** ARIA label for accessibility */
    'aria-label'?: string;
    /** ARIA labelledby for accessibility */
    'aria-labelledby'?: string;

    // Selection props
    /** Selection mode: 'none', 'single', or 'multiple' */
    'selectionMode'?: SelectionMode;
    /** Controlled selected keys */
    'selectedKeys'?: Iterable<Key>;
    /** Default selected keys (uncontrolled) */
    'defaultSelectedKeys'?: Iterable<Key>;
    /** Callback when selection changes */
    'onSelectionChange'?: (keys: Set<Key>) => void;
    /** Keys that are disabled */
    'disabledKeys'?: Iterable<Key>;
    /** Whether empty selection is allowed (default: true) */
    'disallowEmptySelection'?: boolean;

    // Animation props
    /** Enable stagger enter animation for items */
    'animate'?: boolean;
    /**
     * When this value changes, the stagger entrance animation re-runs.
     * Used by NodeList to trigger re-animation on prompt transitions.
     */
    'animationKey'?: string | number;

    // Rendering props
    /**
     * Enable virtualization for large collections.
     * When true, only items visible in the viewport are rendered.
     * Note: Layout animations are not supported in virtualized mode.
     */
    'virtualized'?: boolean;

    /**
     * Number of rows to render beyond the visible viewport.
     * Higher values provide smoother scrolling but use more memory.
     * Only applies when `virtualized` is true.
     * @default 5
     */
    'overscan'?: number;

    /** Optional drag and drop hooks */
    'dragAndDropHooks'?: DragAndDropHooks;

    /** Additional class names for the ScrollArea viewport (inner scrollable element) */
    'viewportClassName'?: string;

    /** Scroll orientation for the collection's ScrollArea. Defaults to 'vertical'. */
    'orientation'?: 'vertical' | 'horizontal';

    /**
     * Controls the LayoutGroup id used for scoping layoutId animations.
     * - `undefined` (default): uses `collectionId` — standard scoped behavior
     * - `null`: LayoutGroup has no id — layoutId is global, enabling cross-boundary transitions
     * - `string`: uses the provided string for scoping
     */
    'layoutGroupId'?: string | null;

    /**
     * Children for sort UI components.
     * Use with CollectionSortButton, CollectionSortSelect, or custom UI via useSortManager hook.
     */
    'children'?: React.ReactNode;
  };
