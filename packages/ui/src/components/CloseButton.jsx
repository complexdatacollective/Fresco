import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

const CloseButton = (props) => (
  <motion.div
    id="close-button"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    style={{ cursor: 'pointer' }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  >
    <Icon name="close" />
  </motion.div>
);

export default CloseButton;
