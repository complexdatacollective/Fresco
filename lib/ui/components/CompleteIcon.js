import React from 'react';
import { motion } from 'framer-motion';

const CompleteIcon = () => {
  const icon = {
    hidden: {
      pathLength: 0,
      scale: 0,
      stroke: 'transparent',
      fill: 'transparent',
    },
    visible: {
      pathLength: 1,
      scale: 1,
      stroke: 'var(--primary)',
      transition: {
        delay: 0.5,
        type: 'spring',
        damping: 7,
        stiffness: 20,
      },
    },
  };

  return (
    <motion.svg className="progress-icon" viewBox="0 0 50 50" style={{ height: '100%', width: '100%' }}>
      <motion.path
        strokeWidth="4"
        fill="none"
        d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
        style={{ translateX: 5, translateY: 5 }}
        variants={icon}
        initial="hidden"
        animate="visible"
      />
      <motion.path
        strokeWidth="4"
        fill="none"
        d="M14,26 L 22,33 L 35,16"
        strokeDasharray="0 1"
        variants={icon}
        initial="hidden"
        animate="visible"
      />
    </motion.svg>
  );
};

export default CompleteIcon;
