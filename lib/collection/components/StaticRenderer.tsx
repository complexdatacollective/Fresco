import { useCollectionStore } from '../contexts';
import { type Layout } from '../layout/Layout';
import { type SelectionManager } from '../selection/SelectionManager';
import {
  type Collection,
  type CollectionProps,
  type ItemRenderer,
  type Key,
} from '../types';
import { CollectionItem } from './CollectionItem';

export type StaticRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  selectionManager: SelectionManager;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
};

/**
 * Non-virtualized renderer that renders all items using CSS Grid/Flexbox.
 * Uses the layout's getContainerStyles() method to determine CSS layout properties.
 * All items are rendered regardless of viewport visibility.
 */
export function StaticRenderer<T>({
  layout,
  collection,
  selectionManager,
  renderItem,
  dragAndDropHooks,
}: StaticRendererProps<T>) {
  // Subscribe to focusedKey from store so we re-render when focus changes
  const focusedKey = useCollectionStore<T, Key | null>(
    (state) => state.focusedKey,
  );

  // Get CSS styles from layout (flexbox for list, CSS grid for grid)
  const containerStyle = layout.getContainerStyles();

  return (
    <div style={containerStyle}>
      {Array.from(collection).map((node) => {
        const isSelected = selectionManager.isSelected(node.key);
        const isFocused = focusedKey === node.key;
        const isDisabled = selectionManager.isDisabled(node.key);

        const itemState = {
          isSelected,
          isFocused,
          isDisabled,
          isDragging: false,
          isDropTarget: false,
        };

        return (
          <CollectionItem
            key={node.key}
            itemKey={node.key}
            state={itemState}
            dragAndDropHooks={dragAndDropHooks}
          >
            {renderItem(node.value, itemState)}
          </CollectionItem>
        );
      })}
    </div>
  );
}
