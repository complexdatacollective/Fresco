import { type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { type DragMetadata, useDropTarget } from '~/lib/dnd';
import { cx } from '~/utils/cva';

type NodeBinProps = {
  accepts: (node: NcNode) => boolean;
  dropHandler: (node: NcNode, metadata?: DragMetadata) => void;
};

const NodeBin = ({ accepts, dropHandler }: NodeBinProps) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'node-bin',
    accepts: ['EXISTING_NODE', 'FAMILY_TREE_NODE'],
    announcedName: 'Delete bin',
    onDrop: (metadata) => {
      const node = metadata as NcNode;
      if (accepts(node)) {
        dropHandler(node, metadata);
      }
    },
  });

  return (
    <motion.div
      {...dropProps}
      className={cx(
        'pointer-events-auto absolute bottom-7 left-1/2 z-50',
        'h-28 w-20 -translate-x-1/2 overflow-hidden',
        'bg-[url(/images/node-bin.svg)] bg-contain bg-no-repeat',
        'drop-shadow-[0_2.4rem_2.4rem_var(--nc-drop-shadow-color,rgba(0,0,0,0.3))]',
      )}
      initial={{ opacity: 0, y: '1.8rem' }}
      animate={
        willAccept
          ? {
              opacity: 1,
              y: 0,
              scale: isOver ? 2 : 1,
            }
          : { opacity: 0, y: '1.8rem', scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  );
};

export default NodeBin;
