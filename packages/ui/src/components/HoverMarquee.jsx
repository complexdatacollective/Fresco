import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import useSize from '../hooks/useSize';

const HoverMarquee = React.memo(({
  speed,
  children,
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const size = useSize(containerRef);

  const contentVariants = {
    hover: {
      left: 0,
      transition: {
        duration: 0,
        ease: 'linear',
      },
    },
  };

  useEffect(() => {
    const delta = contentRef.current.offsetWidth - containerRef.current.offsetWidth;
    contentVariants.hover.left = `-${delta}px`;
    contentVariants.hover.transition.duration = delta / speed;
  }, [containerRef.current, contentRef.current, size]);

  return (
    <div
      className="hover-marquee"
      ref={containerRef}
    >
      <motion.span transition={{ duration: 0 }} whileHover="hover" variants={contentVariants} ref={contentRef}>
        {children}
      </motion.span>
    </div>
  );
}, () => false);

HoverMarquee.defaultProps = {
  speed: 100,
};

HoverMarquee.propTypes = {
  speed: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export default HoverMarquee;
