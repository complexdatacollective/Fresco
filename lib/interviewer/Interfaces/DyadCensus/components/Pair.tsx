import { type EdgeColor } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import Node from '~/lib/interviewer/components/Node';
import { cx } from '~/utils/cva';

const pairVariants = {
  initial: {
    y: '100%',
    opacity: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  animate: {
    y: '0%',
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      when: 'afterChildren',
    },
  },
};

const edgeVariants = {
  hideEdge: { backgroundPosition: 'right bottom' },
  showEdge: { backgroundPosition: 'left bottom' },
};

const edgeColorMap: Record<EdgeColor, string> = {
  'edge-color-seq-1': '[--edge-color:var(--color-edge-1)]',
  'edge-color-seq-2': '[--edge-color:var(--color-edge-2)]',
  'edge-color-seq-3': '[--edge-color:var(--color-edge-3)]',
  'edge-color-seq-4': '[--edge-color:var(--color-edge-4)]',
  'edge-color-seq-5': '[--edge-color:var(--color-edge-5)]',
  'edge-color-seq-6': '[--edge-color:var(--color-edge-6)]',
  'edge-color-seq-7': '[--edge-color:var(--color-edge-7)]',
  'edge-color-seq-8': '[--edge-color:var(--color-edge-8)]',
};

type PairProps = {
  fromNode?: NcNode;
  toNode?: NcNode;
  edgeColor: EdgeColor;
  hasEdge?: boolean | null;
};

export default function Pair({
  fromNode,
  toNode,
  edgeColor,
  hasEdge = false,
}: PairProps) {
  if (!fromNode || !toNode) {
    return null;
  }

  return (
    <motion.div
      variants={pairVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex w-md items-center"
    >
      <Node {...fromNode} />
      <motion.div
        className={cx(
          edgeColorMap[edgeColor],
          'mx-[-1.5rem] h-2 w-full transition-[background] duration-300 ease-out',
          'bg-[linear-gradient(to_right,var(--edge-color)_50%,transparent_50%)] bg-[length:200%_100%]',
        )}
        variants={edgeVariants}
        initial="hideEdge"
        animate={!hasEdge ? 'hideEdge' : 'showEdge'}
      />
      <Node {...toNode} />
    </motion.div>
  );
}
