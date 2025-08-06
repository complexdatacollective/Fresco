import { useVirtualizer } from '@tanstack/react-virtual';
import { useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// MVP of animated virtual list to debug staggered animations
// approach - animate only the initially rendered items
// future items will appear instantly after initial animation completes
type MVPListProps = {
  items: string[];
  onItemClick?: (item: string, index: number) => void;
  className?: string;
};

const ListItem = ({
  item,
  index,
  onItemClick,
  shouldAnimate,
}: {
  item: string;
  index: number;
  onItemClick?: (item: string, index: number) => void;
  shouldAnimate: boolean;
}) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (shouldAnimate) {
      // Initially visible items - animate in with stagger (only on first render)
      animate(
        scope.current,
        { opacity: 1, y: 0 },
        { duration: 0.3, delay: index * 0.02 },
      );
    } else {
      // Either not initially visible OR list has already animated - instantly show
      animate(scope.current, { opacity: 1, y: 0 }, { duration: 0 });
    }
  }, [animate, shouldAnimate, index, scope]);

  return (
    <div
      ref={scope}
      style={{ opacity: 0, transform: 'translateY(20px)' }}
      className="bg-accent flex cursor-pointer justify-center rounded-md p-4 text-white"
      onClick={() => onItemClick?.(item, index)}
    >
      {item}
    </div>
  );
};

export const MVPList = ({
  items,
  onItemClick,
  className = '',
}: MVPListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initiallyRenderedItems, setInitiallyRenderedItems] = useState<
    Set<number>
  >(new Set());
  const hasSetInitialItems = useRef(false);
  const [listHasAnimated, setListHasAnimated] = useState(false);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 72,
    gap: 8,
  });

  useEffect(() => {
    // Only capture initially rendered items on first render
    if (
      !hasSetInitialItems.current &&
      virtualizer.getVirtualItems().length > 0
    ) {
      const virtualItems = virtualizer.getVirtualItems();
      const renderedIndexes = new Set(virtualItems.map((item) => item.index));

      setInitiallyRenderedItems(renderedIndexes);
      hasSetInitialItems.current = true;

      // Mark list as animated after initial staggered animation completes
      // Last item delay + animation duration + small buffer
      const maxIndex = Math.max(...Array.from(renderedIndexes));
      const animationCompleteTime = (maxIndex * 0.02 + 0.3 + 0.1) * 1000;

      setTimeout(() => {
        console.log(
          'List animation completed - future items will appear instantly',
        );
        setListHasAnimated(true);
      }, animationCompleteTime);
    }
  }, [virtualizer]);

  return (
    <div
      ref={containerRef}
      className={`border-accent rounded-md border-2 bg-white px-12 py-6 ${className} h-96 overflow-y-auto`}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ListItem
              item={items[virtualItem.index] ?? `Item ${virtualItem.index}`}
              index={virtualItem.index}
              onItemClick={onItemClick}
              shouldAnimate={
                initiallyRenderedItems.has(virtualItem.index) &&
                !listHasAnimated
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MVPList;
