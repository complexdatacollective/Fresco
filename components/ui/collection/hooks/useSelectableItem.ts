'use client';

import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCollectionStore } from '../contexts';
import { type SelectionManager } from '../selection/SelectionManager';
import {
  type SelectableItemResult,
  type SelectionMode,
} from '../selection/types';
import { type Key } from '../types';

type UseSelectableItemOptions = {
  /** The key of this item */
  key: Key;
  /** Selection manager instance */
  selectionManager: SelectionManager;
  /** Ref to the item element (for focus management) */
  ref: React.RefObject<HTMLElement | null>;
  /** Whether selection should happen on focus */
  selectOnFocus?: boolean;
};

/**
 * Hook for making an item selectable within a collection.
 * Provides props to spread on the item element and state information.
 *
 * @example
 * ```tsx
 * function SelectableItem({ itemKey, selectionManager }) {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { itemProps, isSelected, isFocused } = useSelectableItem({
 *     key: itemKey,
 *     selectionManager,
 *     ref,
 *   });
 *
 *   return (
 *     <div
 *       ref={ref}
 *       {...itemProps}
 *       className={isSelected ? 'selected' : ''}
 *     >
 *       Item content
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectableItem(
  options: UseSelectableItemOptions,
): SelectableItemResult {
  const { key, selectionManager, ref, selectOnFocus = false } = options;

  // Subscribe to all of this item's derived state in a single store
  // subscription with shallow comparison. Previously we had five separate
  // `useCollectionStore` calls, each installing its own `useSyncExternalStore`
  // subscription; for a list of N items that multiplies the selector and
  // subscription overhead by 5 on every store update.
  type ItemSelectionSnapshot = {
    isSelected: boolean;
    isFocused: boolean;
    isDisabled: boolean;
    isFocusedCollection: boolean;
    selectionMode: SelectionMode;
  };

  const {
    isSelected,
    isFocused,
    isDisabled,
    isFocusedCollection,
    selectionMode,
  } = useCollectionStore<unknown, ItemSelectionSnapshot>(
    useShallow((state) => ({
      isSelected:
        state.selectedKeys === 'all'
          ? !state.disabledKeys.has(key)
          : state.selectedKeys.has(key),
      isFocused: state.focusedKey === key,
      isDisabled: state.disabledKeys.has(key),
      isFocusedCollection: state.isFocused,
      selectionMode: state.selectionMode,
    })),
  );

  // Focus management: focus the DOM element when this item becomes focused
  useEffect(() => {
    if (isFocused && isFocusedCollection && ref.current) {
      ref.current.focus({ preventScroll: true });
    }
  }, [isFocused, isFocusedCollection, ref]);

  // Scroll focused item into view
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.scrollIntoView?.({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isFocused, ref]);

  // Handle focus event
  const handleFocus = useCallback(() => {
    if (isDisabled) {
      return;
    }

    if (selectionManager.focusedKey !== key) {
      selectionManager.setFocusedKey(key);
    }

    if (selectOnFocus && selectionMode !== 'none') {
      selectionManager.replaceSelection(key);
    }
  }, [key, selectionManager, selectOnFocus, selectionMode, isDisabled]);

  // Handle click event. Delegates to `handleItemClick`, which batches the
  // focus and selection changes into a single store write so subscribers
  // only wake once per click.
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDisabled || selectionMode === 'none') {
        return;
      }
      selectionManager.handleItemClick(key, {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });
    },
    [key, selectionManager, isDisabled, selectionMode],
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDisabled) {
        return;
      }

      // Skip Ctrl+D and Alt+Space - reserved for drag initiation
      if (e.ctrlKey && e.key.toLowerCase() === 'd') return;
      if (e.altKey && e.key === ' ') return;

      switch (e.key) {
        case ' ':
        case 'Enter': {
          if (selectionMode !== 'none') {
            e.preventDefault();
            if (e.shiftKey && selectionMode === 'multiple') {
              selectionManager.extendSelection(key);
            } else {
              selectionManager.toggleSelection(key);
            }
          }
          break;
        }
      }
    },
    [key, selectionManager, isDisabled, selectionMode],
  );

  // Toggle selection helper
  const toggle = useCallback(() => {
    if (!isDisabled && selectionMode !== 'none') {
      selectionManager.toggleSelection(key);
    }
  }, [key, selectionManager, isDisabled, selectionMode]);

  // Select only this item helper
  const select = useCallback(() => {
    if (!isDisabled && selectionMode !== 'none') {
      selectionManager.replaceSelection(key);
    }
  }, [key, selectionManager, isDisabled, selectionMode]);

  return {
    itemProps: {
      'tabIndex': -1,
      'onFocus': handleFocus,
      'onClick': handleClick,
      'onKeyDown': handleKeyDown,
      'aria-selected': selectionMode !== 'none' ? isSelected : undefined,
      'aria-disabled': isDisabled ? true : undefined,
    },
    isSelected,
    isFocused,
    isDisabled,
    toggle,
    select,
  };
}
