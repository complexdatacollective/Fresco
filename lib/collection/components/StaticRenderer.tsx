import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type CollectionProps,
  type ItemRenderer,
} from '../types';
import { CollectionItem } from './CollectionItem';
import { useStaggerAnimation } from '../hooks/useStaggerAnimation';

type StaticRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  animate?: boolean;
  collectionId: string;
};

/**
 * Non-virtualized renderer that renders all items using CSS Grid/Flexbox.
 * Uses the layout's getContainerStyles() method to determine CSS layout properties.
 * All items are rendered regardless of viewport visibility.
 * Supports optional stagger enter animation using the imperative useAnimate API.
 */
export function StaticRenderer<T>({
  layout,
  collection,
  renderItem,
  dragAndDropHooks,
  animate: shouldAnimate,
  collectionId,
}: StaticRendererProps<T>) {
  // Get CSS styles from layout (flexbox for list, CSS grid for grid)
  const containerStyle = layout.getContainerStyles();

  const scope = useStaggerAnimation(shouldAnimate ?? false, collection.size);

  // Get layout item styles (e.g., fixed width for InlineGridLayout)
  const layoutItemStyle = layout.getItemStyles();

  return (
    <LayoutGroup id={collectionId}>
      <div ref={scope} style={containerStyle}>
        <AnimatePresence mode="popLayout">
          {Array.from(collection).map((node) => (
            <motion.div
              key={node.key}
              layout="position"
              exit={{ scale: 0.6, opacity: 0 }}
              style={layoutItemStyle}
            >
              <div data-stagger-item>
                <CollectionItem
                  node={node}
                  renderItem={renderItem}
                  dragAndDropHooks={dragAndDropHooks}
                  layout={layout}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
