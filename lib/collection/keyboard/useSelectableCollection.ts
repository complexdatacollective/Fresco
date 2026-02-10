'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { type SelectionManager } from '../selection/SelectionManager';
import { type KeyboardDelegate } from './types';

type UseSelectableCollectionOptions = {
  /** Selection manager for the collection */
  selectionManager: SelectionManager;
  /** Keyboard delegate for navigation */
  keyboardDelegate: KeyboardDelegate;
  /** Ref to the collection container element */
  ref: RefObject<HTMLElement> | null;
  /** Whether empty selection is disallowed */
  disallowEmptySelection?: boolean;
  /** Whether select all (Ctrl+A) is disabled */
  disallowSelectAll?: boolean;
  /** Whether type-ahead search is disabled */
  disallowTypeAhead?: boolean;
};

type UseSelectableCollectionResult = {
  /** Props to spread on the collection container */
  collectionProps: {
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
    tabIndex: number;
  };
};

/**
 * Provides keyboard navigation for a collection.
 * Implements roving tabindex pattern and handles selection via keyboard.
 */
export function useSelectableCollection(
  options: UseSelectableCollectionOptions,
): UseSelectableCollectionResult {
  const {
    selectionManager,
    keyboardDelegate,
    ref,
    disallowSelectAll = false,
    disallowTypeAhead = false,
  } = options;

  // Type-ahead search state
  const searchRef = useRef('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTypeAhead = useCallback(
    (char: string) => {
      if (disallowTypeAhead || !keyboardDelegate.getKeyForSearch) {
        return;
      }

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Append character to search string
      searchRef.current += char;

      // Search for matching key
      const matchKey = keyboardDelegate.getKeyForSearch(
        searchRef.current,
        selectionManager.focusedKey ?? undefined,
      );

      if (matchKey !== null) {
        selectionManager.setFocusedKey(matchKey);
      }

      // Clear search after 500ms idle
      searchTimeoutRef.current = setTimeout(() => {
        searchRef.current = '';
      }, 500);
    },
    [disallowTypeAhead, keyboardDelegate, selectionManager],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { focusedKey } = selectionManager;

      // Handle navigation keys
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextKey = focusedKey
            ? keyboardDelegate.getKeyBelow(focusedKey)
            : keyboardDelegate.getFirstKey();

          if (nextKey !== null) {
            if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
              // Range selection
              selectionManager.extendSelection(nextKey);
            }
            selectionManager.setFocusedKey(nextKey);
          }
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          const prevKey = focusedKey
            ? keyboardDelegate.getKeyAbove(focusedKey)
            : keyboardDelegate.getLastKey();

          if (prevKey !== null) {
            if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
              // Range selection
              selectionManager.extendSelection(prevKey);
            }
            selectionManager.setFocusedKey(prevKey);
          }
          break;
        }

        case 'ArrowLeft': {
          if (keyboardDelegate.getKeyLeftOf && focusedKey) {
            e.preventDefault();
            const leftKey = keyboardDelegate.getKeyLeftOf(focusedKey);
            if (leftKey !== null) {
              if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
                selectionManager.extendSelection(leftKey);
              }
              selectionManager.setFocusedKey(leftKey);
            }
          }
          break;
        }

        case 'ArrowRight': {
          if (keyboardDelegate.getKeyRightOf && focusedKey) {
            e.preventDefault();
            const rightKey = keyboardDelegate.getKeyRightOf(focusedKey);
            if (rightKey !== null) {
              if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
                selectionManager.extendSelection(rightKey);
              }
              selectionManager.setFocusedKey(rightKey);
            }
          }
          break;
        }

        case 'Home': {
          e.preventDefault();
          const firstKey = keyboardDelegate.getFirstKey();
          if (firstKey !== null) {
            if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
              selectionManager.extendSelection(firstKey);
            }
            selectionManager.setFocusedKey(firstKey);
          }
          break;
        }

        case 'End': {
          e.preventDefault();
          const lastKey = keyboardDelegate.getLastKey();
          if (lastKey !== null) {
            if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
              selectionManager.extendSelection(lastKey);
            }
            selectionManager.setFocusedKey(lastKey);
          }
          break;
        }

        case 'PageUp': {
          if (keyboardDelegate.getKeyPageAbove && focusedKey) {
            e.preventDefault();
            const pageUpKey = keyboardDelegate.getKeyPageAbove(focusedKey);
            if (pageUpKey !== null) {
              if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
                selectionManager.extendSelection(pageUpKey);
              }
              selectionManager.setFocusedKey(pageUpKey);
            }
          }
          break;
        }

        case 'PageDown': {
          if (keyboardDelegate.getKeyPageBelow && focusedKey) {
            e.preventDefault();
            const pageDownKey = keyboardDelegate.getKeyPageBelow(focusedKey);
            if (pageDownKey !== null) {
              if (e.shiftKey && selectionManager.selectionMode === 'multiple') {
                selectionManager.extendSelection(pageDownKey);
              }
              selectionManager.setFocusedKey(pageDownKey);
            }
          }
          break;
        }

        case ' ':
        case 'Enter': {
          if (
            focusedKey !== null &&
            selectionManager.selectionMode !== 'none'
          ) {
            e.preventDefault();
            selectionManager.toggleSelection(focusedKey);
          }
          break;
        }

        case 'a': {
          if (
            (e.ctrlKey || e.metaKey) &&
            !disallowSelectAll &&
            selectionManager.selectionMode === 'multiple'
          ) {
            e.preventDefault();
            selectionManager.selectAll();
            break;
          }
          // Fall through to type-ahead for regular 'a' key
          handleTypeAhead(e.key);
          break;
        }

        case 'Escape': {
          if (!options.disallowEmptySelection) {
            e.preventDefault();
            selectionManager.clearSelection();
          }
          break;
        }

        default: {
          // Type-ahead search
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            handleTypeAhead(e.key);
          }
        }
      }
    },
    [
      selectionManager,
      keyboardDelegate,
      disallowSelectAll,
      options.disallowEmptySelection,
      handleTypeAhead,
    ],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent) => {
      // Only handle focus if it's entering the collection from outside
      // (not when focus moves between items within the collection)
      if (ref?.current?.contains(e.relatedTarget as Node)) {
        return;
      }

      selectionManager.setFocused(true);

      // Delegate focus to the appropriate item
      if (selectionManager.focusedKey === null) {
        const firstSelected = selectionManager.firstSelectedKey;
        const initialKey = firstSelected ?? keyboardDelegate.getFirstKey();
        if (initialKey !== null) {
          selectionManager.setFocusedKey(initialKey);
        }
      }
    },
    [selectionManager, keyboardDelegate, ref],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Only handle blur if focus is leaving the collection entirely
      if (ref?.current?.contains(e.relatedTarget as Node)) {
        return;
      }

      selectionManager.setFocused(false);
    },
    [selectionManager, ref],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    collectionProps: {
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      tabIndex: 0, // Container is always tabbable - items have tabIndex=-1
    },
  };
}
