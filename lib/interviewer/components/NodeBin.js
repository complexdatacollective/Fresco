import { useDroppable } from '@dnd-kit/core';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

/**
  * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
  */
const NodeBin = () => {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'node-bin',
  });


  const classNames = cx(
    'node-bin',
    { 'node-bin--active': active },
    { 'node-bin--hover': isOver },
  );

  return createPortal(<div className={classNames} />, document.body);
};

NodeBin.propTypes = {
  isOver: PropTypes.bool,
  willAccept: PropTypes.bool,
};

export default NodeBin;
