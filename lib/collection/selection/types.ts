import { type Key } from '../types';

/**
 * Selection mode determines how many items can be selected.
 * - 'none': No selection allowed
 * - 'single': Only one item can be selected at a time
 * - 'multiple': Multiple items can be selected
 */
export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * Selection behavior when clicking an item.
 * - 'toggle': Clicking toggles the item's selection state
 * - 'replace': Clicking replaces the entire selection with just that item
 */
export type SelectionBehavior = 'toggle' | 'replace';

/**
 * How disabled items affect interaction.
 * - 'selection': Disabled items can't be selected but can be focused
 * - 'all': Disabled items can't be selected or focused
 */
export type DisabledBehavior = 'selection' | 'all';

/**
 * Strategy for focusing a child element.
 * - 'first': Focus the first focusable child
 * - 'last': Focus the last focusable child
 */
export type FocusStrategy = 'first' | 'last';

/**
 * Raw selection state managed by the store.
 */
export type SelectionState = {
  /** Current selection mode */
  selectionMode: SelectionMode;
  /** Set of currently selected keys, or 'all' for select all */
  selectedKeys: Set<Key> | 'all';
  /** Currently focused key */
  focusedKey: Key | null;
  /** Whether the collection itself is focused */
  isFocused: boolean;
  /** Strategy for focusing children */
  childFocusStrategy: FocusStrategy | null;
  /** Set of disabled keys */
  disabledKeys: Set<Key>;
  /** How disabled items behave */
  disabledBehavior: DisabledBehavior;
  /** Selection behavior on click */
  selectionBehavior: SelectionBehavior;
  /** Whether empty selection is allowed */
  disallowEmptySelection: boolean;
};

/**
 * Actions for mutating selection state.
 */
export type SelectionActions = {
  /** Set the selection mode */
  setSelectionMode: (mode: SelectionMode) => void;
  /** Set the selected keys */
  setSelectedKeys: (keys: Set<Key> | 'all') => void;
  /** Set the focused key */
  setFocusedKey: (key: Key | null, childFocusStrategy?: FocusStrategy) => void;
  /** Set whether the collection is focused */
  setFocused: (isFocused: boolean) => void;
  /** Set the disabled keys */
  setDisabledKeys: (keys: Set<Key>) => void;
  /** Set the selection behavior */
  setSelectionBehavior: (behavior: SelectionBehavior) => void;
  /** Set whether empty selection is allowed */
  setDisallowEmptySelection: (disallow: boolean) => void;
};

/**
 * Props for controlling selection from outside the component.
 */
export type SelectionProps = {
  /** Selection mode */
  selectionMode?: SelectionMode;
  /** Controlled selected keys */
  selectedKeys?: Iterable<Key>;
  /** Default selected keys (uncontrolled) */
  defaultSelectedKeys?: Iterable<Key>;
  /** Callback when selection changes */
  onSelectionChange?: (keys: Set<Key>) => void;
  /** Keys that are disabled */
  disabledKeys?: Iterable<Key>;
  /** How disabled items behave */
  disabledBehavior?: DisabledBehavior;
  /** Selection behavior on click */
  selectionBehavior?: SelectionBehavior;
  /** Whether empty selection is allowed */
  disallowEmptySelection?: boolean;
};

/**
 * Result of the useSelectableItem hook.
 */
export type SelectableItemResult = {
  /** Props to spread on the item element */
  itemProps: {
    'tabIndex': number;
    'onFocus': () => void;
    'onClick': (e: React.MouseEvent) => void;
    'onKeyDown': (e: React.KeyboardEvent) => void;
    'aria-selected': boolean | undefined;
    'aria-disabled': boolean | undefined;
  };
  /** Whether the item is selected */
  isSelected: boolean;
  /** Whether the item is focused */
  isFocused: boolean;
  /** Whether the item is disabled */
  isDisabled: boolean;
  /** Toggle the item's selection */
  toggle: () => void;
  /** Select only this item */
  select: () => void;
};
