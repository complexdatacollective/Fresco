import { motion } from 'motion/react';
import PropTypes from 'prop-types';

const container = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delay: 0.15,
      when: 'beforeChildren',
    },
  },
};

const item = {
  initial: { opacity: 0, y: '-200%' },
  animate: { opacity: 1, y: 0 },
};

/**
 * Renders a set of pips indicating the current `Prompt`.
 */
const Pips = (props) => {
  const { large, count = 0, currentIndex = 0 } = props;

  const pips = [];

  for (let index = 0; index < count; index += 1) {
    const classes =
      currentIndex === index ? 'pips__pip pips__pip--active' : 'pips__pip';
    pips.push(<div key={index} className={classes} />);
  }

  const className = `pips ${large ? 'pips--large' : ''}`;

  return (
    <motion.div
      className={className}
      variants={container}
    >
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          className={`pips__pip ${index === currentIndex ? 'pips__pip--active' : ''
            }`}
          variants={item}
        />
      ))}
    </motion.div>
  );
};

Pips.propTypes = {
  large: PropTypes.bool,
  count: PropTypes.number,
  currentIndex: PropTypes.number,
};

export default Pips;
