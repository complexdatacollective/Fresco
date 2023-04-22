import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Drop = ({ children }) => (
  <motion.div
    animate={{
      opacity: 1,
      y: '0',
    }}
    initial={{
      opacity: 0,
      y: '-5vh',
    }}
  >
    {children}
  </motion.div>
);

Drop.propTypes = {
  children: PropTypes.any,
};

Drop.defaultProps = {
  children: null,
};

export default Drop;
