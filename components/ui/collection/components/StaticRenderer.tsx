import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { memo } from 'react';
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
 *
 * Memoized so that unrelated parent re-renders (e.g. context value changes)
 * do not force reconciliation of all N children, which is critical for large
 * collections where each child is a `motion.div` + `CollectionItem`.
 */
function StaticRendererComponent<T>({
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

  // Fast path: no animation requested → skip the motion/LayoutGroup stack
  // entirely and render plain divs. Motion wrappers have a measurable cost
  // per instance even when no animation is active (context subscriptions,
  // frame-loop registration, etc.), and `motion.div` forwarding through
  // motion's internals added ~5 ms of post-commit work on a 500-item list.
  if (!shouldAnimate) {
    return (
      <div ref={scope} style={containerStyle}>
        {Array.from(collection).map((node) => (
          <div key={node.key} style={layoutItemStyle}>
            <div data-stagger-item data-stagger-key={animationKey}>
              <CollectionItem
                node={node}
                renderItem={renderItem}
                dragAndDropHooks={dragAndDropHooks}
                layout={layout}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <LayoutGroup id={effectiveLayoutGroupId}>
      <div ref={scope} style={containerStyle}>
        <AnimatePresence initial={false} mode="popLayout">
          {Array.from(collection).map((node) => (
            <motion.div
              key={node.key}
              layout="position"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
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

export const StaticRenderer = memo(
  StaticRendererComponent,
) as typeof StaticRendererComponent;
