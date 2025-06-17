import { motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import useResizeAware from 'react-resize-aware';

const HoverMarquee = ({ speed = 100, children }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [resizeListener, sizes] = useResizeAware();

  const contentVariants = useMemo(
    () => ({
      hover: {
        left: 0,
        transition: {
          duration: 0,
          ease: 'linear',
        },
      },
    }),
    [],
  );

  useEffect(() => {
    const delta =
      contentRef.current.offsetWidth - containerRef.current.offsetWidth;
    contentVariants.hover.left = `-${delta}px`;
    contentVariants.hover.transition.duration = delta / speed;
  }, [containerRef, contentRef, sizes, speed, contentVariants]);

  return (
    <div className="hover-marquee" ref={containerRef}>
      {resizeListener}
      <motion.span
        transition={{ duration: 0 }}
        whileHover="hover"
        variants={contentVariants}
        ref={contentRef}
      >
        {children}
      </motion.span>
    </div>
  );
};

HoverMarquee.propTypes = {
  speed: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export default HoverMarquee;
