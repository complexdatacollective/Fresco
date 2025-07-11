import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { DropTarget } from '../behaviours/DragAndDrop/DropTarget';
import { MonitorDropTarget } from '../behaviours/DragAndDrop/MonitorDropTarget';
import { createPortal } from 'react-dom';

/**
  * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
  */
const NodeBin = ({ accepts, dropHandler, targetId = 'node-bin' }) => {
  return (
    <DropTarget
      id={targetId}
      accepts={({ meta }) => accepts(meta)}
      onDrop={({ meta }) => dropHandler(meta)}
    >
      {(elementRef, _dropState) => (
        <MonitorDropTarget targetId={targetId}>
          {(monitorState) => {
            const classNames = cx(
              'node-bin',
              { 'node-bin--active': monitorState.willAccept },
              { 'node-bin--hover': monitorState.willAccept && monitorState.isOver },
            );

            return createPortal(
              <div ref={elementRef} className={classNames} />,
              document.body
            );
          }}
        </MonitorDropTarget>
      )}
    </DropTarget>
  );
};

NodeBin.propTypes = {
  accepts: PropTypes.func.isRequired,
  dropHandler: PropTypes.func.isRequired,
  targetId: PropTypes.string,
};

export default NodeBin;
