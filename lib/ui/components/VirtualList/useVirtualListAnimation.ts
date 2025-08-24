// Reusable hook to manage animations in a virtual list

import type { Variants } from 'motion/react';
import { useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

type Item = { id: number };

// Custom animation configuration type
// todo: can we reuse motion's types here?
export type CustomAnimation = {
  // Exit animation for list transition
  exitAnimation?: {
    targets: string;
    keyframes: Record<string, unknown>;
    options?: Record<string, unknown>;
  };
  // Enter animation variants for individual items
  itemVariants?: Variants;
};

type UseVirtualListAnimationParams<T extends Item> = {
  items: T[];
  listId: string; // Controlled listId to decide when to animate
  containerRef?: React.RefObject<HTMLElement>;
  columns: number;
  customAnimation?: CustomAnimation; // Optional custom animation configuration
};

const ANIMATION_TOTAL_DURATION = 1.0;

// Persistent animation history map — survives unmount/remount
const hasAnimatedMap: Record<string, boolean> = {};

export function useVirtualListAnimation<T extends Item>({
  items,
  listId,
  // containerRef,
  columns,
  customAnimation,
}: UseVirtualListAnimationParams<T>) {
  const [displayItems, setDisplayItems] = useState(items); // Local copy of items, so we can handle transitioning when items change.
  const [isTransitioning, setIsTransitioning] = useState(false); // Are we currently animating?

  const [initiallyVisibleItems, setInitiallyVisibleItems] = useState<
    Set<number>
  >(new Set()); // Track initially visible items for animation
  const [hasCapturedInitialItems, setHasCapturedInitialItems] = useState(false); // Have we captured the initial visible items?

  const animatedItemsRef = useRef<Set<number>>(new Set()); // Track items that have been animated
  const visibleItemOrderRef = useRef<Map<number, number>>(new Map()); // Track order of visible items for animation delays

  const prevListIdRef = useRef<string | null>(null);
  const [scope, animate] = useAnimate();

  // Track whether this is the *true* first render for this listId
  const isTrueFirstRender = useRef(false);
  if (!hasAnimatedMap[listId]) {
    isTrueFirstRender.current = true;
    hasAnimatedMap[listId] = true;
  }

  // Animation effect controlled by listId changes
  useEffect(() => {
    if (prevListIdRef.current === null) {
      // On mount: only animate if it's the first time we've seen this listId
      setDisplayItems(items);
      prevListIdRef.current = listId;
      return;
    }

    if (prevListIdRef.current !== listId) {
      // listId changed, so start transition to animate exit/enter sequence
      setIsTransitioning(true);

      const exitAnimation = async () => {
        // Use custom exit animation if provided, otherwise use default
        if (customAnimation?.exitAnimation) {
          const { targets, keyframes, options } = customAnimation.exitAnimation;
          await animate(targets, keyframes, options);
        } else {
          // Default: Animate out existing items simultaneously (no stagger)
          await animate('.item', { scale: 0, opacity: 0 }, { duration: 0.2 });
        }

        // TODO: This works, but breaks the initial animation. No way around it I can find.
        // Disabling makes the animation work, but leaves the user scrolled to wherever they were.
        // containerRef.current?.scrollTo({ top: 0 });

        // Update to new items after exit completes
        setDisplayItems(items);

        // Reset animation tracking for new items
        animatedItemsRef.current = new Set();
        visibleItemOrderRef.current = new Map();
        setInitiallyVisibleItems(new Set());
        setHasCapturedInitialItems(false);
        setIsTransitioning(false);
      };

      void exitAnimation();
    } else {
      // No listId change — just update displayItems immediately without animation
      setDisplayItems(items);
    }

    prevListIdRef.current = listId;
  }, [listId, items, animate, customAnimation]);

  // Capture initially visible items for stagger animation
  const captureVisibleItems = (virtualRows: { index: number }[]) => {
    if (hasCapturedInitialItems || columns === 1 || isTransitioning) return;

    const visibleIds = new Set<number>();
    const itemOrder = new Map<number, number>();
    let visibleIndex = 0;

    virtualRows.forEach((row) => {
      const startIndex = row.index * columns;
      for (let i = 0; i < columns; i++) {
        const itemIndex = startIndex + i;
        if (itemIndex < displayItems.length) {
          const itemId = displayItems[itemIndex]!.id;
          visibleIds.add(itemId);
          itemOrder.set(itemId, visibleIndex++);
        }
      }
    });

    if (visibleIds.size > 0) {
      setInitiallyVisibleItems(visibleIds);
      visibleItemOrderRef.current = itemOrder;
      setHasCapturedInitialItems(true);
    }
  };

  /**
   * Should this item animate?
   * If it's initially visible and hasn't animated yet, we animate it and mark it as animated.
   * Also skips if this listId has already animated before (DnD remount protection).
   */
  const shouldAnimateItem = (id: number) => {
    if (!isTrueFirstRender.current) return false;
    const should =
      initiallyVisibleItems.has(id) && !animatedItemsRef.current.has(id);
    if (should) animatedItemsRef.current.add(id);
    return should;
  };

  /**
   * Regardless of the number of items that are being animated,
   * we want the animation to finish in ANIMATION_TOTAL_DURATION
   * seconds. This helps make the stagger effect more consistent.
   */
  const getItemDelay = (id: number) => {
    const visibleOrder = visibleItemOrderRef.current.get(id) ?? 0;
    const totalVisibleCount = initiallyVisibleItems.size;
    return totalVisibleCount > 1
      ? (ANIMATION_TOTAL_DURATION * visibleOrder) / (totalVisibleCount - 1)
      : 0;
  };

  /**
   * Get animation variants for an item.
   * Returns custom variants if provided, otherwise returns default variants.
   */
  const getItemVariants = () => {
    if (customAnimation?.itemVariants) {
      return customAnimation.itemVariants;
    }

    // Default variants
    return {
      initial: { opacity: 0, y: '100%' },
      animate: { opacity: 1, y: '0%' },
      exit: { opacity: 0, y: '-100%' },
    };
  };

  return {
    displayItems,
    isTransitioning,
    scope,
    animate,
    shouldAnimateItem,
    getItemDelay,
    captureVisibleItems,
    getItemVariants,
  };
}
