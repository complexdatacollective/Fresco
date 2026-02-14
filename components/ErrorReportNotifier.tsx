import { CheckIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';

const labelAnimationVariants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

export default function ErrorReportNotifier({ error }: { error: Error }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    posthog.captureException(error, {
      path: window?.location?.pathname ?? 'unknown',
      userAgent: window?.navigator?.userAgent ?? 'unknown',
    });

    initialized.current = true;
  }, [error]);

  return (
    <div className="absolute top-10 right-10">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="success"
          className="flex items-center text-sm"
          variants={labelAnimationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <CheckIcon className="text-success mr-2" />
          Error report sent.
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
