import { type NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import Node from '~/lib/interviewer/components/Node';
import { cx } from '~/utils/cva';

const animationOffset = 200;
const animationTarget = -50;

const pairTransition = {
  duration: 0.5,
  delay: 0.15,
  when: 'afterChildren' as const,
};

const getPairVariants = () => {
  const translateUp = `${animationTarget - animationOffset}%`;
  const translateDown = `${animationTarget + animationOffset}%`;
  const translateTarget = `${animationTarget}%`;

  return {
    initial: ([isForwards]: [boolean]) => ({
      translateY: isForwards ? translateDown : translateUp,
      translateX: '-50%',
      opacity: 0,
    }),
    show: () => ({
      translateY: translateTarget,
      translateX: '-50%',
      opacity: 1,
    }),
    hide: ([isForwards]: [boolean]) => ({
      translateY: !isForwards ? translateDown : translateUp,
      translateX: '-50%',
      opacity: 0,
    }),
  };
};

type PairProps = {
  fromNode: NcNode;
  toNode: NcNode;
  edgeColor: string;
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
  const pairVariants = getPairVariants();

  const edgeVariants = {
    hideEdge: { backgroundPosition: 'right bottom' },
    showEdge: { backgroundPosition: 'left bottom' },
  };

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      custom={[animateForwards]}
      variants={pairVariants}
      transition={pairTransition}
      initial="initial"
      animate="show"
      exit="hide"
      style={{
        // @ts-expect-error - CSS custom properties are not typed
        '--edge-color': `var(--nc-${edgeColor})`,
      }}
    >
      <div className="flex items-center justify-center">
        <Node {...fromNode} className="relative z-[2]" />
        <motion.div
          className={cx(
            'relative z-[1] mx-[-1.5rem] h-2 w-44 transition-[background] duration-[var(--animation-duration-standard)] ease-[var(--animation-easing)]',
            'bg-[linear-gradient(to_right,var(--edge-color)_50%,var(--nc-background)_50%)] bg-[length:200%_100%]',
          )}
          variants={edgeVariants}
          initial="hideEdge"
          animate={!hasEdge ? 'hideEdge' : 'showEdge'}
        />
        <Node {...toNode} className="relative z-[2]" />
      </div>
    </motion.div>
  );
}
