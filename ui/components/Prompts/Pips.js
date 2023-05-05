import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delay: 0.15,
      when: 'beforeChildren',
    },
  },
};

const item = {
  hidden: { opacity: 0, y: '-200%' },
  show: { opacity: 1, y: 0 },
};

/**
  * Renders a set of pips indicating the current `Prompt`.
  */
const Pips = (props) => {
  const {
    large,
    count,
    currentIndex,
  } = props;

  const pips = [];

  for (let index = 0; index < count; index += 1) {
    const classes = (currentIndex === index ? 'pips__pip pips__pip--active' : 'pips__pip');
    pips.push(<div key={index} className={classes} />);
  }

  const className = `pips ${large ? 'pips--large' : ''}`;

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      { [...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          className={`pips__pip ${index === currentIndex ? 'pips__pip--active' : ''}`}
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

Pips.defaultProps = {
  count: 0,
  currentIndex: 0,
  large: false,
};

export default Pips;
