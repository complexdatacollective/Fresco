import {
  AnimatePresence,
  LayoutGroup,
  motion,
  stagger,
  useAnimate,
} from 'motion/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import {
  CollectionItemContext,
  useCollectionId,
  useSelectionManager,
} from '../contexts';
import { useSelectableItem } from '../hooks/useSelectableItem';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type CollectionProps,
  type ItemProps,
  type ItemRenderer,
  type Node,
} from '../types';

export type StaticRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  animate?: boolean;
  collectionId: string;
};

const ANIMATION_CONFIG = {
  staggerDelay: 0.05,
  initialOpacity: 1,
  initialY: '20%',
} as const;

type StaticRendererItemProps<T> = {
  node: Node<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  layout: Layout<T>;
};

function StaticRendererItemComponent<T>({
  node,
  renderItem,
  dragAndDropHooks,
  layout,
}: StaticRendererItemProps<T>) {
  const selectionManager = useSelectionManager();
  const collectionId = useCollectionId() ?? 'collection';
  const localRef = useRef<HTMLElement>(null);

  const { itemProps, isSelected, isFocused, isDisabled } = useSelectableItem({
    key: node.key,
    selectionManager,
    ref: localRef,
  });

  // Get item-level drag props if hooks provided
  const dndDragPropsRaw = dragAndDropHooks?.useDraggableItemProps
    ? dragAndDropHooks.useDraggableItemProps(node.key)
    : {};

  const { ref: dragRef, ...dndDragProps } = dndDragPropsRaw as {
    ref?: (el: HTMLElement | null) => void;
    [key: string]: unknown;
  };

  // Combined ref callback that also registers the element with the layout
  const combinedRef = useCallback(
    (el: HTMLElement | null) => {
      (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
      if (dragRef) {
        dragRef(el);
      }
      // Register the element with the layout for DOM-based position queries
      layout.registerItemRef(node.key, el);
    },
    [dragRef, layout, node.key],
  );

  const itemId = `${collectionId}-item-${node.key}`;
  const contextValue = { key: node.key };

  // Build ItemProps to pass to renderItem
  const fullItemProps: ItemProps = {
    'ref': combinedRef,
    'tabIndex': itemProps.tabIndex,
    'role': 'option',
    'aria-selected': isSelected || undefined,
    'aria-disabled': isDisabled || undefined,
    'data-collection-item': true,
    'data-selected': isSelected || undefined,
    'data-focused': isFocused || undefined,
    'data-disabled': isDisabled || undefined,
    'data-dragging': undefined,
    'data-drop-target': undefined,
    'onFocus': itemProps.onFocus as React.FocusEventHandler<HTMLElement>,
    'onClick': itemProps.onClick as React.MouseEventHandler<HTMLElement>,
    'onKeyDown': itemProps.onKeyDown as React.KeyboardEventHandler<HTMLElement>,
    'onPointerDown': dndDragProps.onPointerDown as
      | React.PointerEventHandler<HTMLElement>
      | undefined,
    'onPointerMove': dndDragProps.onPointerMove as
      | React.PointerEventHandler<HTMLElement>
      | undefined,
    'id': itemId,
    ...dndDragProps,
  };

  return (
    <CollectionItemContext.Provider value={contextValue}>
      {renderItem(node.value, fullItemProps)}
    </CollectionItemContext.Provider>
  );
}

const StaticRendererItem = memo(
  StaticRendererItemComponent,
) as typeof StaticRendererItemComponent;

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
        { opacity: [0, 1], y: ['20%', '0%'] },
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
              style={layoutItemStyle}
            >
              <StaticRendererItem
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
