import React, { useState, useEffect, useRef } from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import cx from 'classnames';
import { getCSSVariableAsString, getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import Node from './Node';
import scrollable from '../behaviours/scrollable';
import {
  DragSource,
  DropTarget,
  MonitorDropTarget,
  MonitorDragSource,
} from '../behaviours/DragAndDrop';
import createSorter from '../utils/createSorter';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 } from 'uuid';

const EnhancedNode = DragSource(Node);

const NodeList = (props) => {
  const {
    disableDragNew,
    items: initialItems = [],
    label = () => '',
    itemType = 'NODE',
    isOver,
    willAccept,
    meta = {},
    hoverColor,
    className,
    stage: { id: stageId },
    externalData,
    sortOrder = [],
    onDrop = () => { },
    onItemClick = () => { },
  } = props;

  const [items, setItems] = useState(createSorter(sortOrder)(initialItems));
  const [stagger, setStagger] = useState(true);
  const instanceId = useRef(v4());



  const isSource = !!find(items, [entityPrimaryKeyProperty, meta.entityPrimaryKeyProperty ?? null]);
  const isValidTarget = !isSource && willAccept;
  const isHovering = isValidTarget && isOver;

  const classNames = cx('node-list', className, { 'node-list--drag': isValidTarget });
  const hoverBackgroundColor = hoverColor || getCSSVariableAsString('--nc-light-background');
  const styles = isHovering ? { backgroundColor: hoverBackgroundColor } : {};

  return (
    <motion.div className={classNames} style={styles} layout>
      <AnimatePresence mode="sync">
        {initialItems.map((node, index) => {
          const isDraggable =
            !(externalData && disableDragNew) && !(disableDragNew && node.stageId !== stageId);
          return (
            <motion.div
              layout
              onClick={() => onItemClick(node)}
              key={`${instanceId.current}-${node[entityPrimaryKeyProperty]}`}
              initial={{ opacity: 0, y: '3rem' }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: stagger ? index * 0.05 : 0 } }}
              exit={{ opacity: 0, scale: 0, }}
            >
              <EnhancedNode
                allowDrag={isDraggable}
                label={`${label(node)}`}
                meta={() => ({ ...node, itemType })}
                itemType={itemType}
                {...node}
              />
            </motion.div>
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

export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
  MonitorDragSource(['meta', 'isDragging']),
  scrollable,
)(NodeList);
