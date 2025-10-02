import { type NcNode } from '@codaco/shared-consts';
import cx from 'classnames';
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

  return <div {...dropProps} className={classNames} />;
};

export default NodeBin;
