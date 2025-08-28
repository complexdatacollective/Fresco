import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import { find } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { isEqual } from 'ohash';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { cn } from '~/utils/shadcn';
import {
  DragSource,
  DropTarget,
  MonitorDragSource,
  MonitorDropTarget,
} from '../behaviours/DragAndDrop';
import scrollable from '../behaviours/scrollable';
import { MotionFamilyTreeNode } from '../containers/Interfaces/FamilyTreeCensus/FamilyTreeNode';
import { getCurrentStageId } from '../selectors/session';

const EnhancedFamilyTreeNode = DragSource(MotionFamilyTreeNode);

const FamilyTreePlaceholderNodeList = memo(
  ({
    disableDragNew,
    items = [],
    itemType = 'PLACEHOLDER_NODE',
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

    const classNames = cn(
      'flex flex-wrap justify-center min-h-full w-full transition-background duration-300 content-start rounded-md',
      willAccept && 'bg-[var(--nc-node-list-action-bg)]',
      isHovering && (hoverColor ? `bg-[var(${hoverColor})]` : 'bg-accent'),
    );

    return (
      <AnimatePresence mode="popLayout">
        {items.map((node) => {
          const isDraggable = !disableDragNew || node.stageId === stageId;
          return (
            <motion.div key={node.id} exit={{ scale: 0 }}>
              <EnhancedFamilyTreeNode
                layout
                allowDrag={!node.unDeletable && isDraggable}
                meta={() => ({ ...node, itemType })}
                itemType={itemType}
                onClick={() => onItemClick(node)}
                {...node}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    );
  },
  (prevProps, nextProps) => {
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

FamilyTreePlaceholderNodeList.displayName = 'FamilyTreePlaceholderNodeList';

export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
  MonitorDragSource(['meta', 'isDragging']),
  scrollable,
)(FamilyTreePlaceholderNodeList);
