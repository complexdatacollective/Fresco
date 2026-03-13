import { type EdgeColor } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import Node from '~/lib/interviewer/components/Node';
import { edgeColorMap } from '~/lib/interviewer/utils/edgeColorMap';
import { cx } from '~/utils/cva';

const pairVariants = {
  initial: (isForwards: boolean) => ({
    y: isForwards ? '100%' : '-100%',
    opacity: 0,
  }),
  animate: {
    y: '0%',
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      when: 'beforeChildren' as const,
    },
  },
  exit: (isForwards: boolean) => ({
    y: isForwards ? '-100%' : '100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      when: 'afterChildren' as const,
    },
  }),
};

const edgeVariants = {
  hideEdge: { backgroundPosition: 'right bottom' },
  showEdge: { backgroundPosition: 'left bottom' },
};

type PairProps = {
  fromNode: NcNode | undefined;
  toNode: NcNode | undefined;
  edgeColor: EdgeColor;
  hasEdge?: boolean | null;
  animateForwards?: boolean;
};

export default function Pair({
  fromNode,
  toNode,
  edgeColor,
  hasEdge = false,
  animateForwards = true,
}: PairProps) {
  if (!fromNode || !toNode) {
    return null;
  }

  return (
    <motion.div
      custom={animateForwards}
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
