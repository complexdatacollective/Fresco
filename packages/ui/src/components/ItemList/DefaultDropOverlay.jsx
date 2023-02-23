import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import cx from 'classnames';

const DefaultDropOverlay = ({ isOver }) => {
  const reducedMotion = useReducedMotion();
  const classNames = cx({
    'item-list__drop-overlay': true,
    'item-list__drop-overlay--active': isOver,
  });

  return (
    <motion.div
      key="drop-overlay"
      className={classNames}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
    >
      <h2>Drop here</h2>
    </motion.div>
  );
};

export default DefaultDropOverlay;
