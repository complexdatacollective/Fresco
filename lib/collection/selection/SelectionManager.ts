import { type Collection, type Key } from '../types';
import { Selection } from './Selection';
import {
  type DisabledBehavior,
  type FocusStrategy,
  type SelectionBehavior,
  type SelectionMode,
  type SelectionState,
} from './types';

/**
 * Options for creating a SelectionManager.
 */
export type SelectionManagerOptions = {
  /** Callback when selection changes */
  onSelectionChange?: (keys: Set<Key>) => void;
};

/**
 * SelectionManager provides a rich API for managing selection state.
 * It wraps the raw selection state and collection to provide
 * convenient methods for common selection operations.
 */
export class SelectionManager {
  private collection: Collection<unknown>;
  private state: SelectionState;
  private setState: (updates: Partial<SelectionState>) => void;
  private options: SelectionManagerOptions;

  constructor(
    collection: Collection<unknown>,
    state: SelectionState,
    setState: (updates: Partial<SelectionState>) => void,
    options: SelectionManagerOptions = {},
  ) {
    this.collection = collection;
    this.state = state;
    this.setState = setState;
    this.options = options;
  }

  // ============================================================
  // Queries
  // ============================================================

  /** Get the current selection mode */
  get selectionMode(): SelectionMode {
    return this.state.selectionMode;
  }

  /** Get the currently focused key */
  get focusedKey(): Key | null {
    return this.state.focusedKey;
  }

  /** Check if the collection is focused */
  get isFocused(): boolean {
    return this.state.isFocused;
  }

  /** Get the selection behavior */
  get selectionBehavior(): SelectionBehavior {
    return this.state.selectionBehavior;
  }

  /** Get the disabled behavior */
  get disabledBehavior(): DisabledBehavior {
    return this.state.disabledBehavior;
  }

  /** Check if a specific key is selected */
  isSelected(key: Key): boolean {
    if (this.state.selectionMode === 'none') {
      return false;
    }

    if (this.state.selectedKeys === 'all') {
      return this.canSelectItem(key);
    }

    return this.state.selectedKeys.has(key);
  }

  /** Check if a specific key is disabled */
  isDisabled(key: Key): boolean {
    return this.state.disabledKeys.has(key);
  }

  /** Check if a key can be focused (respects disabledBehavior) */
  canFocusItem(key: Key): boolean {
    if (this.state.disabledBehavior === 'all' && this.isDisabled(key)) {
      return false;
    }
    const item = this.collection.getItem(key);
    return item?.type === 'item';
  }

  /** Check if a key can be selected */
  canSelectItem(key: Key): boolean {
    if (this.state.selectionMode === 'none') {
      return false;
    }
    if (this.isDisabled(key)) {
      return false;
    }
    const item = this.collection.getItem(key);
    return item?.type === 'item';
  }

  /** Get all selected keys as a Set */
  get selectedKeys(): Set<Key> {
    if (this.state.selectedKeys === 'all') {
      return new Set(this.getAllSelectableKeys());
    }
    return new Set(this.state.selectedKeys);
  }

  /** Check if selection is empty */
  get isEmpty(): boolean {
    if (this.state.selectedKeys === 'all') {
      return false;
    }
    return this.state.selectedKeys.size === 0;
  }

  /** Check if all selectable items are selected */
  get isSelectAll(): boolean {
    const { selectedKeys } = this.state;
    if (selectedKeys === 'all') {
      return true;
    }
    const allKeys = this.getAllSelectableKeys();
    return allKeys.every((k) => selectedKeys.has(k));
  }

  /** Get the first selected key */
  get firstSelectedKey(): Key | null {
    if (this.state.selectedKeys === 'all') {
      return this.collection.getFirstKey();
    }
    for (const key of this.collection.getKeys()) {
      if (this.state.selectedKeys.has(key)) {
        return key;
      }
    }
    return null;
  }

  /** Get the last selected key */
  get lastSelectedKey(): Key | null {
    if (this.state.selectedKeys === 'all') {
      return this.collection.getLastKey();
    }
    let lastKey: Key | null = null;
    for (const key of this.collection.getKeys()) {
      if (this.state.selectedKeys.has(key)) {
        lastKey = key;
      }
    }
    return lastKey;
  }

  // ============================================================
  // Mutations
  // ============================================================

  /** Set the focused key */
  setFocusedKey(
    key: Key | null,
    childFocusStrategy: FocusStrategy = 'first',
  ): void {
    if (key === null || this.collection.getItem(key)) {
      this.setState({
        focusedKey: key,
        childFocusStrategy,
      });
    }
  }

  /** Set whether the collection is focused */
  setFocused(isFocused: boolean): void {
    this.setState({ isFocused });
  }

  /** Toggle selection of a key */
  toggleSelection(key: Key): void {
    if (this.state.selectionMode === 'none' || !this.canSelectItem(key)) {
      return;
    }

    const currentSelection = this.ensureSelection();
    let newSelection: Selection;

    if (currentSelection.has(key)) {
      // Check if we can deselect
      if (this.state.disallowEmptySelection && currentSelection.size === 1) {
        return;
      }
      newSelection = currentSelection.deleteKey(key);
    } else {
      if (this.state.selectionMode === 'single') {
        // Single mode: replace selection
        newSelection = new Selection([key], key, key);
      } else {
        // Multiple mode: add to selection
        newSelection = currentSelection.addKey(key);
      }
    }

    this.updateSelection(newSelection);
  }

  /** Replace the entire selection with a single key */
  replaceSelection(key: Key): void {
    if (this.state.selectionMode === 'none') {
      return;
    }

    const newSelection = this.canSelectItem(key)
      ? new Selection([key], key, key)
      : new Selection();

    if (this.state.disallowEmptySelection && newSelection.size === 0) {
      return;
    }

    this.updateSelection(newSelection);
  }

  /** Extend selection from anchor to the given key (shift+click) */
  extendSelection(toKey: Key): void {
    if (this.state.selectionMode !== 'multiple') {
      this.replaceSelection(toKey);
      return;
    }

    const currentSelection = this.ensureSelection();
    const anchorKey =
      currentSelection.anchorKey ?? this.state.focusedKey ?? toKey;
    const previousCurrentKey = currentSelection.currentKey ?? anchorKey;

    // Start with current selection
    const newSelection = new Selection(currentSelection, anchorKey, toKey);

    // Remove old range
    for (const key of this.getKeyRange(anchorKey, previousCurrentKey)) {
      newSelection.delete(key);
    }

    // Add new range
    for (const key of this.getKeyRange(anchorKey, toKey)) {
      if (this.canSelectItem(key)) {
        newSelection.add(key);
      }
    }

    this.updateSelection(newSelection);
  }

  /** Select all items */
  selectAll(): void {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    // Use 'all' for efficient storage
    this.setState({ selectedKeys: 'all' });
    this.options.onSelectionChange?.(this.selectedKeys);
  }

  /** Clear all selections */
  clearSelection(): void {
    if (this.state.disallowEmptySelection) {
      return;
    }

    this.setState({ focusedKey: null });
    this.updateSelection(new Selection());
  }

  /** Select a range of keys */
  selectRange(fromKey: Key, toKey: Key): void {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    const newSelection = new Selection([], fromKey, toKey);
    for (const key of this.getKeyRange(fromKey, toKey)) {
      if (this.canSelectItem(key)) {
        newSelection.add(key);
      }
    }

    this.updateSelection(newSelection);
  }

  // ============================================================
  // Helpers
  // ============================================================

  /** Ensure we have a Selection object (not 'all') */
  private ensureSelection(): Selection {
    if (this.state.selectedKeys === 'all') {
      return new Selection(this.getAllSelectableKeys());
    }
    if (this.state.selectedKeys instanceof Selection) {
      return this.state.selectedKeys;
    }
    return new Selection(this.state.selectedKeys);
  }

  /** Get all keys that can be selected */
  private getAllSelectableKeys(): Key[] {
    const keys: Key[] = [];
    for (const key of this.collection.getKeys()) {
      if (this.canSelectItem(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /** Get keys in a range (inclusive) */
  private getKeyRange(fromKey: Key, toKey: Key): Key[] {
    const keys: Key[] = [];
    let started = false;
    let finished = false;

    for (const key of this.collection.getKeys()) {
      if (key === fromKey || key === toKey) {
        if (!started) {
          started = true;
        } else {
          finished = true;
        }
      }

      if (started) {
        keys.push(key);
      }

      if (finished) {
        break;
      }
    }

    return keys;
  }

  /** Update selection and notify listeners */
  private updateSelection(selection: Selection): void {
    this.setState({ selectedKeys: selection });
    this.options.onSelectionChange?.(new Set(selection));
  }
}
