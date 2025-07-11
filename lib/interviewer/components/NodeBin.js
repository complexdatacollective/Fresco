import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { useDropTarget } from '../behaviours/DragAndDrop/DropTarget';
import { useDropTargetMonitor } from '../behaviours/DragAndDrop/MonitorDropTarget';
import { createPortal } from 'react-dom';

/**
  * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
  */
const NodeBin = ({ accepts, dropHandler, targetId = 'node-bin' }) => {
  const { elementRef } = useDropTarget({
    id: targetId,
    accepts: ({ meta }) => accepts(meta),
    onDrop: ({ meta }) => dropHandler(meta),
  });

  const monitorState = useDropTargetMonitor(targetId);

  const classNames = cx(
    'node-bin',
    { 'node-bin--active': monitorState.willAccept },
    { 'node-bin--hover': monitorState.willAccept && monitorState.isOver },
  );

  return createPortal(
    <div ref={elementRef} className={classNames} />,
    document.body
  );
};

NodeBin.propTypes = {
  accepts: PropTypes.func.isRequired,
  dropHandler: PropTypes.func.isRequired,
  targetId: PropTypes.string,
};

export default NodeBin;
