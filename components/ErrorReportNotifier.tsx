import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, Loader2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '~/lib/analytics';

const labelAnimationVariants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

type ReportStates = 'idle' | 'loading' | 'success' | 'error';

export function ReportNotifier({ state = 'idle' }: { state?: ReportStates }) {
  return (
    <div className="absolute right-10 top-10">
      <AnimatePresence mode="wait" initial={false}>
        {state === 'loading' && (
          <motion.div
            key="loading"
            className="flex items-center text-sm text-muted-foreground"
            variants={labelAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Loader2 className="mr-2 animate-spin" />
            Sending analytics data...
          </motion.div>
        )}
        {state === 'success' && (
          <motion.div
            key="success"
            className="flex items-center text-sm"
            variants={labelAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckIcon className="mr-2 text-success" />
            Sent analytics data!
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div
            key="error"
            className="flex items-center text-sm"
            variants={labelAnimationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <XCircle className="mr-2 text-destructive" />
            Error sending analytics data.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ErrorReportNotifier({ error }: { error: Error }) {
  const initialized = useRef(false);
  const [state, setState] = useState<ReportStates>('idle');

  useEffect(() => {
    if (initialized.current) return;
    setState('loading');

    trackEvent({
      type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      metadata: {
        path: window?.location?.pathname ?? 'unknown',
        userAgent: window?.navigator?.userAgent ?? 'unknown',
      },
    })
      .then((result) => {
        if (!result.success) {
          setState('error');
          return;
        }

        setState('success');
      })
      .catch(() => {
        setState('error');
      });
    initialized.current = true;
  }, [error]);

  return <ReportNotifier state={state} />;
}
