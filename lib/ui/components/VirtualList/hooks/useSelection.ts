import { useCallback, useState } from 'react';

type UseSelectionProps<T> = {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  multiSelect?: boolean;
  onItemSelect?: (items: T[]) => void;
};

export const useSelection = <T>({
  items,
  keyExtractor,
  multiSelect = false,
  onItemSelect,
}: UseSelectionProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const isItemSelected = useCallback((item: T, index: number) => {
    const itemKey = keyExtractor(item, index);
    return selectedItems.has(itemKey);
  }, [selectedItems, keyExtractor]);

  const selectItem = useCallback((item: T, index: number) => {
    const itemKey = keyExtractor(item, index);
    let newSelected: Set<string>;

    if (multiSelect) {
      newSelected = new Set(selectedItems);
      if (newSelected.has(itemKey)) {
        newSelected.delete(itemKey);
      } else {
        newSelected.add(itemKey);
      }
    } else {
      newSelected = new Set([itemKey]);
    }

    setSelectedItems(newSelected);

    if (onItemSelect) {
      const selectedItemsArray = items.filter((item, index) => 
        newSelected.has(keyExtractor(item, index))
      );
      onItemSelect(selectedItemsArray);
    }
  }, [items, keyExtractor, multiSelect, selectedItems, onItemSelect]);

  const selectAll = useCallback(() => {
    if (multiSelect) {
      const allKeys = new Set(items.map((item, index) => keyExtractor(item, index)));
      setSelectedItems(allKeys);

      if (onItemSelect) {
        onItemSelect([...items]);
      }
    }
  }, [items, keyExtractor, multiSelect, onItemSelect]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    if (onItemSelect) {
      onItemSelect([]);
    }
  }, [onItemSelect]);

  const getSelectedItems = useCallback(() => {
    return items.filter((item, index) => 
      selectedItems.has(keyExtractor(item, index))
    );
  }, [items, selectedItems, keyExtractor]);

  return {
    selectedItems: Array.from(selectedItems),
    selectedCount: selectedItems.size,
    isItemSelected,
    selectItem,
    selectAll,
    clearSelection,
    getSelectedItems,
  };
};