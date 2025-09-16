import { motion } from 'motion/react';
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

export default Drop;
