import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode } from 'react';

const ANIMATION_DURATION_FAST = 0.25;
const DEFAULT_EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];

type FadeProps = {
  children: ReactNode;
  in: boolean;
  enter?: boolean;
  customDuration?: { enter: number; exit: number };
  customEasing?: [number, number, number, number];
  onExited?: () => void;
};

export default function Fade({
  children,
  customDuration,
  customEasing,
  enter = true,
  onExited,
  in: inProp,
}: FadeProps) {
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
