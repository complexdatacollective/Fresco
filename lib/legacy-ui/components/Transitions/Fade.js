import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';

const ANIMATION_DURATION_FAST = 0.25;
const DEFAULT_EASING = [0.4, 0, 0.2, 1];

function Fade({
  children,
  customDuration,
  customEasing,
  enter = true,
  onExited,
  in: inProp,
}) {
  const defaultDuration = {
    enter: ANIMATION_DURATION_FAST,
    exit: ANIMATION_DURATION_FAST,
  };

  const duration = customDuration ?? defaultDuration;
  const easing = customEasing ?? DEFAULT_EASING;

  return (
    <AnimatePresence onExitComplete={onExited}>
      {inProp && (
        <motion.div
          initial={enter ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: duration.enter,
            ease: easing,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

Fade.propTypes = {
  children: PropTypes.any,
  customDuration: PropTypes.object,
  customEasing: PropTypes.array,
  enter: PropTypes.bool,
  in: PropTypes.bool.isRequired,
  onExited: PropTypes.func,
};

export default Fade;
