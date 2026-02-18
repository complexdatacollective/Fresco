import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Collection } from '~/lib/collection/components/Collection';
import { useDragAndDrop } from '~/lib/collection/dnd/useDragAndDrop';
import { InlineGridLayout } from '~/lib/collection/layout/InlineGridLayout';
import { type ItemProps } from '~/lib/collection/types';
import { type DropCallback } from '~/lib/dnd/types';
import { cx } from '~/utils/cva';
import Node from './Node';

type NodeListProps = {
  items?: NcNode[];
  id?: string;
  itemType?: string;
  accepts?: string[];
  onDrop?: DropCallback;
  onItemClick?: (node: NcNode) => void;
  nodeSize?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
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

    const keyExtractor = useCallback(
      (node: NcNode) => node[entityPrimaryKeyProperty],
      [],
    );

    // Styling classes including drop state styling via data attributes
    const containerClasses = cx(
      'm-0 size-full grow before:rounded',
      'transition-colors duration-300',
      // data-drop-target-valid corresponds to willAccept
      'data-[drop-target-valid=true]:bg-success/30',
      // data-drop-target-over corresponds to isOver
      'data-[drop-target-over=true]:data-[drop-target-valid=true]:bg-success',
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
        variants={{
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }}
        onAnimationComplete={() => setAnimationComplete(true)}
        className="h-full grow"
      >
        {animationComplete && (
          <Collection
            id={id ?? 'node-list'}
            items={items}
            keyExtractor={keyExtractor}
            layout={layout}
            renderItem={renderItem}
            dragAndDropHooks={
              (accepts ?? onDrop) ? dragAndDropHooks : undefined
            }
            className={containerClasses}
            animate={animate}
            virtualized={virtualized}
            overscan={overscan}
            aria-label="Node list"
            emptyState={null}
          />
        )}
      </motion.div>
    );
  },
);

NodeList.displayName = 'NodeList';

export default NodeList;
