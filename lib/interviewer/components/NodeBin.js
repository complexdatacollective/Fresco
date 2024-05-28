import cx from 'classnames';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import useDroppable from '~/lib/dnd/useDroppable';

/**
  * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
  */
const NodeBin = () => {


  const removeNode = (node) => {
    console.log('removeNode', node);

    // const removeNode = (uid) => {
    //   dispatch(sessionActions.removeNode(uid));
    // };
  };

  const { isOver, ref, isActive } = useDroppable({
    accepts: ['EXISTING_NODE'],
    onDrop: removeNode,
  });

  const classNames = cx(
    'node-bin',
    { 'node-bin--active': isActive },
    { 'node-bin--hover': isOver },
  );

  return createPortal(<div className={classNames} ref={ref} />, document.body);
};

NodeBin.propTypes = {
  isOver: PropTypes.bool,
  willAccept: PropTypes.bool,
};

export default NodeBin;
