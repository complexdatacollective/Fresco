import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion } from 'framer-motion';

const getAnimation = ({ isComplete, isActive }) => {
  if (isComplete) { return { x: '-100%' }; }
  if (isActive) { return { x: 0 }; }
  return { x: '100%' };
};

const Panel = ({
  type, isComplete, isActive, children,
}) => {
  const className = cx(
    'date-picker__panel',
    {
      [`date-picker__panel--${type}`]: type,
      'date-picker__panel--is-complete': isComplete,
      'date-picker__panel--is-active': isActive,
    },
  );

  const animate = getAnimation({ isActive, isComplete });

  return (
    <motion.div
      initial={{ x: 0 }}
      animate={animate}
      transition={{ duration: 0.2, type: 'tween' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

Panel.propTypes = {
  type: PropTypes.string,
  isComplete: PropTypes.bool,
  isActive: PropTypes.bool,
  children: PropTypes.node,
};

Panel.defaultProps = {
  type: null,
  isComplete: false,
  isActive: false,
  children: null,
};

export default Panel;
