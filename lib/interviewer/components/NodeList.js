import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import { find } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { isEqual } from 'ohash';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { cx } from '~/utils/cva';
import {
  DragSource,
  DropTarget,
  MonitorDragSource,
  MonitorDropTarget,
} from '../behaviours/DragAndDrop';
import scrollable from '../behaviours/scrollable';
import { getCurrentStageId } from '../selectors/session';
import { MotionNode } from './Node';

const EnhancedNode = DragSource(MotionNode);

export const NodeTransition = ({ children, delay, exit = false }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: '20%' }}
    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
    exit={{ opacity: 0, scale: 0, transition: { duration: exit ? 0.4 : 0 } }}
  >
    {children}
  </motion.div>
);

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

const nodeVariants = {
  initial: { opacity: 0, y: '-20%', scale: 0 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

const NodeList = memo(
  ({
    disableDragNew,
    items = [],
    itemType = 'NODE',
    isOver,
    willAccept,
    meta = {},
    hoverColor,
    onItemClick = () => undefined,
  }) => {
    const stageId = useSelector(getCurrentStageId);

    const isSource = !!find(items, [
      entityPrimaryKeyProperty,
      meta[entityPrimaryKeyProperty] ?? null,
    ]);

    const isValidTarget = !isSource && willAccept;
    const isHovering = isValidTarget && isOver;

    const classNames = cx(
      'flex flex-wrap justify-center min-h-full w-full transition-background duration-300 content-start rounded-md',
      willAccept && 'bg-[var(--nc-node-list-action-bg)]',
      isHovering && (hoverColor ? `bg-[var(${hoverColor})]` : 'bg-accent'),
    );

    return (
      <motion.div
        className={classNames}
        variants={nodeListVariants}
        layout
        key="node-list"
      >
        <AnimatePresence mode="popLayout">
          {items.map((node) => {
            const isDraggable = !disableDragNew || node.stageId === stageId; // Always allow dragging if the node was created on this stage
            return (
              <motion.div
                key={node[entityPrimaryKeyProperty]}
                variants={nodeVariants}
                exit={{ scale: 0 }}
              >
                <EnhancedNode
                  layout
                  allowDrag={isDraggable}
                  meta={() => ({ ...node, itemType })}
                  itemType={itemType}
                  onClick={() => onItemClick(node)}
                  {...node}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // only re-render if items change, or if isOver, or willAccept change, or click handler changes
    if (prevProps.onItemClick !== nextProps.onItemClick) {
      return false;
    }
    if (prevProps.isOver !== nextProps.isOver) {
      return false;
    }
    if (prevProps.willAccept !== nextProps.willAccept) {
      return false;
    }
    if (!isEqual(prevProps.items, nextProps.items)) {
      return false;
    }

    return true;
  },
);

NodeList.displayName = 'NodeList';

export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
  MonitorDragSource(['meta', 'isDragging']),
  scrollable,
)(NodeList);
