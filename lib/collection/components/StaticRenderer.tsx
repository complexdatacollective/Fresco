import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useStaggerAnimation } from '../hooks/useStaggerAnimation';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type CollectionProps,
  type ItemRenderer,
} from '../types';
import { CollectionItem } from './CollectionItem';

type StaticRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  animate?: boolean;
  animationKey?: string | number;
  collectionId: string;
  layoutGroupId?: string | null;
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
  animationKey,
  collectionId,
  layoutGroupId,
}: StaticRendererProps<T>) {
  // Get CSS styles from layout (flexbox for list, CSS grid for grid)
  const containerStyle = layout.getContainerStyles();

  const scope = useStaggerAnimation(
    shouldAnimate ?? false,
    collection.size,
    animationKey,
  );

  // Get layout item styles (e.g., fixed width for InlineGridLayout)
  const layoutItemStyle = layout.getItemStyles();

  const effectiveLayoutGroupId =
    layoutGroupId === undefined ? collectionId : (layoutGroupId ?? undefined);

  return (
    <LayoutGroup id={effectiveLayoutGroupId}>
      <div ref={scope} className="overflow-hidden" style={containerStyle}>
        <AnimatePresence initial={false} mode="popLayout">
          {Array.from(collection).map((node) => (
            <motion.div
              key={node.key}
              layout={shouldAnimate ? 'position' : undefined}
              initial={shouldAnimate ? { scale: 0.6, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={shouldAnimate ? { scale: 0.6, opacity: 0 } : undefined}
              style={layoutItemStyle}
            >
              <div data-stagger-item data-stagger-key={animationKey}>
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
