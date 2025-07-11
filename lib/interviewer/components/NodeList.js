import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import cx from 'classnames';
import { find } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { v4 } from 'uuid';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { useDragSource } from '../behaviours/DragAndDrop/DragSource';
import { useDropTarget } from '../behaviours/DragAndDrop/DropTarget';
import { useDragSourceMonitor } from '../behaviours/DragAndDrop/MonitorDragSource';
import { useDropTargetMonitor } from '../behaviours/DragAndDrop/MonitorDropTarget';
import scrollable from '../behaviours/scrollable';
import createSorter from '../utils/createSorter';
import Node from './Node';

const EnhancedNode = ({ allowDrag, label, meta, itemType: _itemType, onClick, ...nodeProps }) => {
  const { nodeRef, preview } = useDragSource({
    allowDrag,
    meta,
  });

  return (
    <>
      <Node
        ref={nodeRef}
        label={label}
        handleClick={onClick}
        {...nodeProps}
      />
      {preview}
    </>
  );
};

// TODO: fix drag and drop here, I'm removing unused code for now to remove linting warnings (Mirfayz Karimov)

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
  items: initialItems = [],
  label = () => '',
  itemType = 'NODE',
  hoverColor,
  className,
  stage: { id: stageId },
  externalData,
  sortOrder = [],
  onItemClick = () => undefined,
  // Drop target props
  id = 'node-list',
  accepts,
  onDrop,
  onDrag,
  onDragEnd,
  meta: dropMeta,
}) => {
  const [items] = useState(createSorter(sortOrder)(initialItems));
  const [stagger] = useState(true);
  const instanceId = useRef(v4());

  const { elementRef } = useDropTarget({
    id,
    accepts,
    onDrop,
    onDrag,
    onDragEnd,
    meta: dropMeta,
  });

  const dropMonitorState = useDropTargetMonitor(id);
  const dragMonitorState = useDragSourceMonitor();

  const isSource = !!find(items, [
    entityPrimaryKeyProperty,
    dragMonitorState.source?.entityPrimaryKeyProperty ?? null,
  ]);
  const isValidTarget = !isSource && dropMonitorState.willAccept;
  const isHovering = isValidTarget && dropMonitorState.isOver;

  const classNames = cx('node-list', className, {
    'node-list--drag': isValidTarget,
  });
  const hoverBackgroundColor =
    hoverColor || getCSSVariableAsString('--nc-light-background');
  const styles = isHovering ? { backgroundColor: hoverBackgroundColor } : {};

  return (
    <motion.div
      ref={elementRef}
      className={classNames}
      style={styles}
      layout
    >
      <AnimatePresence mode="sync">
        {initialItems.map((node, index) => {
          const isDraggable =
            !(externalData && disableDragNew) &&
            !(disableDragNew && node.stageId !== stageId);
          return (
            <NodeTransition
              key={`${instanceId.current}-${node[entityPrimaryKeyProperty]}`}
              delay={stagger ? index * 0.05 : 0}
            >
              <EnhancedNode
                allowDrag={isDraggable}
                label={`${label(node)}`}
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

NodeList.propTypes = {
  disableDragNew: PropTypes.bool,
  stage: PropTypes.object.isRequired,
  className: PropTypes.string,
  hoverColor: PropTypes.string,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool,
  isOver: PropTypes.bool,
  items: PropTypes.array,
  itemType: PropTypes.string,
  label: PropTypes.func,
  listId: PropTypes.string.isRequired,
  meta: PropTypes.object,
  onDrop: PropTypes.func,
  onItemClick: PropTypes.func,
  sortOrder: PropTypes.array,
  willAccept: PropTypes.bool,
};

const NodeListWithScrollable = scrollable(NodeList);

export default NodeListWithScrollable;
