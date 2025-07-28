import { useCallback, useEffect, useState } from 'react';

type UseKeyboardNavigationProps<T> = {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  onItemClick?: (item: T, index: number) => void;
  onItemSelect?: (items: T[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
};

export const useKeyboardNavigation = <T>({
  items,
  keyExtractor,
  onItemClick,
  onItemSelect,
  multiSelect = false,
  disabled = false,
}: UseKeyboardNavigationProps<T>) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
        
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          const item = items[focusedIndex];
          if (item) {
            // Handle item click
            if (onItemClick) {
              onItemClick(item, focusedIndex);
            }
            
            // Handle selection
            if (multiSelect && onItemSelect) {
              const itemKey = keyExtractor(item, focusedIndex);
              const newSelected = new Set(selectedItems);
              
              if (newSelected.has(itemKey)) {
                newSelected.delete(itemKey);
              } else {
                newSelected.add(itemKey);
              }
              
              setSelectedItems(newSelected);
              const selectedItemsArray = items.filter((item, index) => 
                newSelected.has(keyExtractor(item, index))
              );
              onItemSelect(selectedItemsArray);
            }
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        if (multiSelect) {
          setSelectedItems(new Set());
          if (onItemSelect) {
            onItemSelect([]);
          }
        }
        setFocusedIndex(-1);
        break;
    }
  }, [disabled, items, focusedIndex, selectedItems, keyExtractor, onItemClick, onItemSelect, multiSelect]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!disabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, disabled]);

  // Reset focused index when items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, focusedIndex]);

  const isItemFocused = useCallback((index: number) => {
    return focusedIndex === index;
  }, [focusedIndex]);

  const isItemSelected = useCallback((item: T, index: number) => {
    const itemKey = keyExtractor(item, index);
    return selectedItems.has(itemKey);
  }, [selectedItems, keyExtractor]);

  return {
    focusedIndex,
    selectedItems: Array.from(selectedItems),
    isItemFocused,
    isItemSelected,
    setFocusedIndex,
    selectItem: (item: T, index: number) => {
      const itemKey = keyExtractor(item, index);
      const newSelected = new Set(selectedItems);
      newSelected.add(itemKey);
      setSelectedItems(newSelected);
    },
    deselectItem: (item: T, index: number) => {
      const itemKey = keyExtractor(item, index);
      const newSelected = new Set(selectedItems);
      newSelected.delete(itemKey);
      setSelectedItems(newSelected);
    },
    clearSelection: () => {
      setSelectedItems(new Set());
      if (onItemSelect) {
        onItemSelect([]);
      }
    },
  };
};