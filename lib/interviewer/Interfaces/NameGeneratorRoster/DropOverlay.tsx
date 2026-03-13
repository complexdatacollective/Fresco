import { motion } from 'motion/react';
import UINode, { type NodeColorSequence } from '~/components/Node';

const variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const iconVariants = {
  over: {
    scale: [0, 1],
    transition: {
      type: 'spring' as const,
    },
  },
  initial: {
    scale: 1,
    y: [0, 7, 0, 7, 0],
    transition: {
      duration: 2,
      loop: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

type DropOverlayProps = {
  isOver: boolean;
  nodeColor: NodeColorSequence;
  message: string;
};

const DropOverlay = ({ isOver, nodeColor, message }: DropOverlayProps) => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center bg-[rgb(58_58_117/80%)] [text-shadow:1px_1px_0.5em_var(--color-rich-black)]"
    variants={variants}
    initial="hidden"
    animate="visible"
    exit="hidden"
  >
    <motion.div variants={iconVariants} animate={isOver ? 'over' : 'initial'}>
      <UINode label="" color={nodeColor} />
    </motion.div>
    <h2>{message}</h2>
  </motion.div>
);

export default DropOverlay;
