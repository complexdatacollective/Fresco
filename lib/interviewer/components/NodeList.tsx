import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { Collection } from '~/lib/collection/components/Collection';
import { useDragAndDrop } from '~/lib/collection/dnd/useDragAndDrop';
import { InlineGridLayout } from '~/lib/collection/layout/InlineGridLayout';
import { type ItemProps } from '~/lib/collection/types';
import { type DropCallback } from '~/lib/dnd/types';
import { cx } from '~/utils/cva';
import { MotionNode } from './Node';

/**
 * @deprecated Use Collection's built-in animations instead
 */
export const NodeTransition = ({
  children,
  delay,
  exit = false,
}: {
  children: ReactNode;
  delay: number;
  exit?: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: '20%' }}
    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
    exit={{ opacity: 0, scale: 0, transition: { duration: exit ? 0.4 : 0 } }}
  >
    {children}
  </motion.div>
);

/**
 * @deprecated Use Collection animations instead
 */
export const nodeListVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      delayChildren: 0.25,
      staggerChildren: 0.05,
    },
  },
  exit: { opacity: 0 },
};

type NodeListProps = {
  items?: NcNode[];
  id?: string;
  itemType?: string;
  accepts?: string[];
  onDrop?: DropCallback;
  onItemClick?: (node: NcNode) => void;
  nodeSize?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
  virtualized?: boolean;
  overscan?: number;
};

const NodeList = memo(
  ({
    items = [],
    id,
    itemType = 'NODE',
    accepts,
    onDrop,
    onItemClick,
    nodeSize = 'md',
    className,
    animate = true,
    virtualized,
    overscan,
  }: NodeListProps) => {
    const layout = useMemo(() => new InlineGridLayout<NcNode>({ gap: 16 }), []);

    // Build drag and drop hooks if accepts or onDrop is provided
    const { dragAndDropHooks } = useDragAndDrop<NcNode>({
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

    const renderItem = useCallback(
      (node: NcNode, itemProps: ItemProps) => {
        // Extract NcNode type to avoid passing it to MotionNode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, ...safeNodeProps } = node;

        // Cast itemProps to match button element types
        // The Collection provides HTMLElement handlers, but Node is a button
        const buttonProps = itemProps as unknown as Omit<
          React.ComponentProps<typeof MotionNode>,
          'size' | 'onClick'
        >;

        return (
          <MotionNode
            {...safeNodeProps}
            {...buttonProps}
            size={nodeSize}
            onClick={() => onItemClick?.(node)}
          />
        );
      },
      [nodeSize, onItemClick],
    );

    const keyExtractor = useCallback(
      (node: NcNode) => node[entityPrimaryKeyProperty],
      [],
    );

    // Styling classes including drop state styling via data attributes
    const containerClasses = cx(
      'transition-colors duration-300',
      // data-drop-target-valid corresponds to willAccept
      'data-[drop-target-valid=true]:bg-success/30',
      // data-drop-target-over corresponds to isOver
      'data-[drop-target-over=true]:data-[drop-target-valid=true]:bg-success',
      className,
    );

    return (
      <Collection
        id={id ?? 'node-list'}
        items={items}
        keyExtractor={keyExtractor}
        layout={layout}
        renderItem={renderItem}
        dragAndDropHooks={(accepts ?? onDrop) ? dragAndDropHooks : undefined}
        className={containerClasses}
        animate={animate}
        virtualized={virtualized}
        overscan={overscan}
        aria-label="Node list"
        emptyState={null}
      />
    );
  },
);

NodeList.displayName = 'NodeList';

export default NodeList;
