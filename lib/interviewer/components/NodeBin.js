import React from 'react';
import { compose, withProps } from 'recompose';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { DropTarget, MonitorDropTarget } from '../behaviours/DragAndDrop';
import { createPortal } from 'react-dom';

/**
  * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
  */
const NodeBin = ({
  willAccept = false,
  isOver = false,
}) => {
  const classNames = cx(
    'node-bin',
    { 'node-bin--active': willAccept },
    { 'node-bin--hover': willAccept && isOver },
  );

  return createPortal(<div className={classNames} />, document.body);
};

NodeBin.propTypes = {
  isOver: PropTypes.bool,
  willAccept: PropTypes.bool,
};

export default compose(
  withProps((props) => ({
    accepts: ({ meta }) => props.accepts(meta),
    onDrop: ({ meta }) => props.dropHandler(meta),
  })),
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(NodeBin);
