import { motion } from 'motion/react';
import PropTypes from 'prop-types';
import Node from '../../../components/Node';

const animationOffset = 200;
const animationTarget = -50;

const pairTransition = {
  duration: 0.5,
  delay: 0.15,
  when: 'afterChildren',
};

const getPairVariants = () => {
  const translateUp = `${animationTarget - animationOffset}%`;
  const translateDown = `${animationTarget + animationOffset}%`;
  const translateTarget = `${animationTarget}%`;

  return {
    initial: ([isForwards]) => ({
      translateY: isForwards ? translateDown : translateUp,
      translateX: '-50%',
      opacity: 0,
    }),
    show: () => ({
      translateY: translateTarget,
      translateX: '-50%',
      opacity: 1,
    }),
    hide: ([isForwards]) => ({
      translateY: !isForwards ? translateDown : translateUp,
      translateX: '-50%',
      opacity: 0,
    }),
  };
};

const Pair = ({
  fromNode,
  toNode,
  edgeColor,
  hasEdge = false,
  animateForwards = true,
}) => {
  const pairVariants = getPairVariants();

  const edgeVariants = {
    hideEdge: { backgroundPosition: 'right bottom' },
    showEdge: { backgroundPosition: 'left bottom' },
  };

  return (
    <motion.div
      className='dyad-census__pair'
      custom={[animateForwards]}
      variants={pairVariants}
      transition={pairTransition}
      initial="initial"
      animate="show"
      exit="hide"
      style={{
        '--edge-color': `var(--nc-${edgeColor})`
      }}
    >
      <div className="dyad-census__nodes">
        <Node {...fromNode} />
        <motion.div
          className={`dyad-census__edge`}
          variants={edgeVariants}
          initial="hideEdge"
          animate={!hasEdge ? 'hideEdge' : 'showEdge'}
        />
        <Node {...toNode} />
      </div>
    </motion.div>
  );
};

Pair.propTypes = {
  fromNode: PropTypes.any.isRequired,
  toNode: PropTypes.any.isRequired,
  edgeColor: PropTypes.string.isRequired,
  hasEdge: PropTypes.bool,
  animateForwards: PropTypes.bool,
};

export default Pair;
