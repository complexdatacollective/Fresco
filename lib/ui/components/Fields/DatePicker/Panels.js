import { motion } from 'motion/react';
import PropTypes from 'prop-types';

const Panels = ({ children }) => (
  <motion.div
    className="date-picker__panels"
    initial={{ scaleY: 0, opacity: 0 }}
    animate={{ scaleY: 1, opacity: 1 }}
    exit={{ scaleY: 0, opacity: 0 }}
    style={{ originX: 0, originY: 0 }}
    transition={{ duration: 0.2, type: 'tween' }}
    layout
  >
    <motion.div className="date-picker__panels-container" layout>
      {children}
    </motion.div>
  </motion.div>
);

Panels.propTypes = {
  children: PropTypes.node,
};

export default Panels;
