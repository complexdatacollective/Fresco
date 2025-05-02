import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import { find } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 } from 'uuid';
import { cn } from '~/utils/shadcn';
import {
  DragSource,
  DropTarget,
  MonitorDragSource,
  MonitorDropTarget,
} from '../behaviours/DragAndDrop';
import scrollable from '../behaviours/scrollable';
import { getCurrentStageId } from '../selectors/session';
import Node from './Node';

const EnhancedNode = DragSource(Node);

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

const NodeList = ({
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

  const [stagger] = useState(true);
  const instanceId = useRef(v4());



  const isSource = !!find(items, [
    entityPrimaryKeyProperty,
    meta[entityPrimaryKeyProperty] ?? null,
  ]);

  const isValidTarget = !isSource && willAccept;
  const isHovering = isValidTarget && isOver;

  const classNames = cn(
    'flex flex-wrap justify-center min-h-full w-full transition-background duration-300 content-start',
    willAccept && 'bg-[var(--nc-node-list-action-bg)]',
    isHovering && (hoverColor ? `bg-[var(${hoverColor})]` : 'bg-accent'),
  )

  return (
    <motion.div className={classNames} layout>
      <AnimatePresence mode="sync">
        {items.map((node, index) => {
          const isDraggable =
            !disableDragNew || node.stageId === stageId // Allow dragging if the node was created on this stage
          return (
            <NodeTransition
              key={`${instanceId.current}-${node[entityPrimaryKeyProperty]}`}
              delay={stagger ? index * 0.05 : 0}
            >
              <EnhancedNode
                allowDrag={isDraggable}
                meta={() => ({ ...node, itemType })}
                itemType={itemType}
                onClick={() => onItemClick(node)}
                {...node}
              />
            </NodeTransition>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};


export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
  MonitorDragSource(['meta', 'isDragging']),
  scrollable,
)(NodeList);
