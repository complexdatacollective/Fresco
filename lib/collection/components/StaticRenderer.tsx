import {
  AnimatePresence,
  LayoutGroup,
  motion,
  stagger,
  useAnimate,
} from 'motion/react';
import { useEffect, useRef } from 'react';
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
  collectionId: string;
};

const ANIMATION_CONFIG = {
  staggerDelay: 0.05,
} as const;

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

  // Setup animation using imperative useAnimate API
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const hasAnimatedRef = useRef(false);

  // Run stagger animation on mount
  useEffect(() => {
    if (!shouldAnimate || hasAnimatedRef.current || collection.size === 0) {
      return;
    }

    hasAnimatedRef.current = true;

    const runAnimation = async () => {
      await animate(
        '[data-collection-item]',
        { opacity: [0, 1], y: ['20%', '0%'], scale: [0.6, 1] },
        {
          type: 'spring',
          stiffness: 500,
          damping: 20,
          delay: stagger(ANIMATION_CONFIG.staggerDelay),
        },
      );
    };

    void runAnimation();
  }, [animate, shouldAnimate, collection.size]);

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
              <CollectionItem
                node={node}
                renderItem={renderItem}
                dragAndDropHooks={dragAndDropHooks}
                layout={layout}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
