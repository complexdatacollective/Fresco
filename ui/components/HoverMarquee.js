import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import useResizeAware from 'react-resize-aware';

const HoverMarquee = ({
  speed,
  children,
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [resizeListener, sizes] = useResizeAware();

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
  }, [containerRef.current, contentRef.current, sizes]);

  return (
    <div
      className="hover-marquee"
      ref={containerRef}
    >
      {resizeListener}
      <motion.span transition={{ duration: 0 }} whileHover="hover" variants={contentVariants} ref={contentRef}>
        {children}
      </motion.span>
    </div>
  );
};

HoverMarquee.defaultProps = {
  speed: 100,
};

HoverMarquee.propTypes = {
  speed: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export default HoverMarquee;
