import { type NcNode } from '@codaco/shared-consts';
import cx from 'classnames';
import { createPortal } from 'react-dom';
import { useDropTarget } from '~/lib/dnd';

type NodeBinProps = {
  accepts: (node: NcNode) => boolean;
  dropHandler: (node: NcNode) => void;
};

/**
 * Renders a droppable NodeBin which accepts `EXISTING_NODE`.
 */
const NodeBin = ({ accepts, dropHandler }: NodeBinProps) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'node-bin',
    accepts: ['node'],
    announcedName: 'Delete bin',
    onDrop: (metadata) => {
      const node = metadata as NcNode;
      if (accepts(node)) {
        dropHandler(node);
      }
    },
  });
  const classNames = cx(
    'node-bin',
    { 'node-bin--active': willAccept },
    { 'node-bin--hover': willAccept && isOver },
  );

  return createPortal(<div {...dropProps} className={classNames} />, document.body);
};

export default NodeBin;
