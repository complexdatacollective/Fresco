import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { motion, animate as motionAnimate } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collection } from '~/lib/collection/components/Collection';
import { useDragAndDrop } from '~/lib/collection/dnd/useDragAndDrop';
import { InlineGridLayout } from '~/lib/collection/layout/InlineGridLayout';
import { type CollectionProps, type ItemProps } from '~/lib/collection/types';
import { type DropCallback } from '~/lib/dnd/types';
import { makeGetCodebookVariablesForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import { cx } from '~/utils/cva';
import Node from './Node';

// Props that NodeList always provides internally — consumers can't override these
type InternalCollectionProps =
  | 'keyExtractor'
  | 'textValueExtractor'
  | 'renderItem'
  | 'layout'
  | 'dragAndDropHooks'
  | 'items';

type NodeListProps = Omit<CollectionProps<NcNode>, InternalCollectionProps> & {
  items?: NcNode[];
  itemType?: string;
  accepts?: string[];
  onDrop?: DropCallback;
  onItemClick?: (node: NcNode) => void;
  nodeSize?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  announcedName: string; // For accessibility announcements related to drag and drop
};

const EXIT_DURATION = 0.2;

const NodeList = memo(
  ({
    // NodeList-specific props
    itemType = 'NODE',
    accepts,
    onDrop,
    onItemClick,
    nodeSize = 'md',
    // Collection props with NodeList defaults
    items = [],
    id,
    className,
    animate = true,
    animationKey,
    emptyState = null,
    announcedName,
    'aria-label': ariaLabel = 'Node list',
    // All other Collection props passed through
    ...collectionProps
  }: NodeListProps) => {
    const layout = useMemo(() => new InlineGridLayout<NcNode>({ gap: 16 }), []);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Item buffering for prompt transitions ---
    const [displayItems, setDisplayItems] = useState(items);
    const [displayAnimationKey, setDisplayAnimationKey] =
      useState(animationKey);
    const latestItemsRef = useRef(items);
    const isTransitioningRef = useRef(false);
    const prevAnimationKeyRef = useRef(animationKey);
    const needsExitRef = useRef(false);

    // Always keep latest items ref up to date
    latestItemsRef.current = items;

    // Detect animationKey change synchronously during render so
    // isTransitioningRef is set BEFORE effects run. This prevents the
    // items-passthrough effect from flashing the new items in.
    if (
      animationKey !== prevAnimationKeyRef.current &&
      prevAnimationKeyRef.current !== undefined
    ) {
      isTransitioningRef.current = true;
      needsExitRef.current = true;
      prevAnimationKeyRef.current = animationKey;
    }

    // When not transitioning, pass items through immediately
    useEffect(() => {
      if (!isTransitioningRef.current) {
        setDisplayItems(items);
      }
    }, [items]);

    // Run exit animation when animationKey changed (flagged during render)
    useEffect(() => {
      if (!needsExitRef.current) {
        return;
      }
      needsExitRef.current = false;

      const container = containerRef.current;
      if (!container) {
        setDisplayItems(latestItemsRef.current);
        setDisplayAnimationKey(animationKey);
        isTransitioningRef.current = false;
        return;
      }

      const staggerItems = container.querySelectorAll<HTMLElement>(
        '[data-stagger-item]',
      );

      if (staggerItems.length === 0) {
        setDisplayItems(latestItemsRef.current);
        setDisplayAnimationKey(animationKey);
        isTransitioningRef.current = false;
        return;
      }

      const nextKey = animationKey;

      void motionAnimate(
        staggerItems,
        { opacity: 0, scale: 0.6 },
        { duration: EXIT_DURATION },
      ).then(() => {
        setDisplayItems(latestItemsRef.current);
        setDisplayAnimationKey(nextKey);
        isTransitioningRef.current = false;
      });
    }, [animationKey]);

    // Build drag and drop hooks if accepts or onDrop is provided
    const { dragAndDropHooks } = useDragAndDrop<NcNode>({
      announcedName,
      getItems: (keys) => [{ type: itemType, keys }],
      acceptTypes: accepts,
      onDrop: onDrop
        ? (e) => {
            // Map Collection's DropEvent to the old metadata format
            onDrop(e.metadata);
          }
        : undefined,
      getItemMetadata: (key) => {
        const node = items.find(
          (n) => n[entityPrimaryKeyProperty] === String(key),
        );
        return node ? { ...node, itemType } : { itemType };
      },
    });

    const keyExtractor = useCallback(
      (node: NcNode) => node[entityPrimaryKeyProperty],
      [],
    );

    const getCodebookVariablesForNodeType = useSelector(
      makeGetCodebookVariablesForNodeType,
    );

    const textValueExtractor = useCallback(
      (node: NcNode) => {
        const codebookVariables = getCodebookVariablesForNodeType(node.type);
        const labelAttrId = getNodeLabelAttribute(
          codebookVariables,
          node[entityAttributesProperty],
        );
        if (labelAttrId) {
          const value = node[entityAttributesProperty][labelAttrId];
          if (typeof value === 'string') return value;
          if (typeof value === 'number') return String(value);
        }
        return node[entityPrimaryKeyProperty];
      },
      [getCodebookVariablesForNodeType],
    );

    // Styling classes including drop state styling via data attributes
    const containerClasses = cx(
      'm-0 size-full grow before:rounded',
      'transition-colors duration-300',
      // data-drop-target-valid corresponds to willAccept
      'data-[drop-target-valid=true]:bg-drag-valid',
      // data-drop-target-over corresponds to isOver
      'data-[drop-target-over=true]:data-[drop-target-valid=true]:bg-drag-over',
      className,
    );

    const renderItem = useCallback(
      (node: NcNode, itemProps: ItemProps) => (
        <Node
          {...node}
          {...itemProps}
          size={nodeSize}
          onClick={() => onItemClick?.(node)}
        />
      ),
      [nodeSize, onItemClick],
    );

    const [animationComplete, setAnimationComplete] = useState(false);

    return (
      <motion.div
        ref={containerRef}
        variants={{
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }}
        onAnimationComplete={() => setAnimationComplete(true)}
        className="size-full grow overflow-hidden"
      >
        {animationComplete && (
          <Collection
            {...collectionProps}
            key={displayAnimationKey}
            id={id ?? 'node-list'}
            items={displayItems}
            keyExtractor={keyExtractor}
            textValueExtractor={textValueExtractor}
            layout={layout}
            renderItem={renderItem}
            dragAndDropHooks={dragAndDropHooks}
            className={containerClasses}
            animate={animate}
            animationKey={displayAnimationKey}
            aria-label={ariaLabel}
            emptyState={emptyState}
          />
        )}
      </motion.div>
    );
  },
);

NodeList.displayName = 'NodeList';

export default NodeList;
