import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const DefaultEmptyComponent = () => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key="empty"
      className="item-list__empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
    >
      <div className="empty__icon" />
      <div className="empty__text">
        No items found
      </div>
    </motion.div>
  );
};

export default DefaultEmptyComponent;
