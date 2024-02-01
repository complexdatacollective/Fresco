'use client';

import { Button } from '~/components/ui/Button';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '~/analytics/utils';
import { cn } from '~/utils/shadcn';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { cardClasses } from '~/components/ui/card';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import FeedbackButton from '~/components/Feedback/FeedbackButton';
import { CheckIcon, ClipboardCopy, Loader2, XCircle } from 'lucide-react';
import { useToast } from '~/components/ui/use-toast';
import { ensureError } from '~/utils/ensureError';

const labelAnimationVariants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

function ReportNotifier({
  state = 'idle',
}: {
  state?: 'idle' | 'loading' | 'success' | 'error';
}) {
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

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  const { toast } = useToast();
  const initialized = useRef(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );

  useEffect(() => {
    if (initialized.current) return;
    setState('loading');

    trackEvent({
      type: 'Error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      metadata: {
        path: window.location.pathname,
        userAgent: navigator.userAgent,
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

  const handleReset = () => {
    initialized.current = false;
    setState('idle');
    reset();
  };

  const copyDebugInfoToClipboard = async () => {
    const debugInfo = `
Error: ${error.message}
Path: ${window.location.pathname}
User Agent: ${navigator.userAgent}
Stack Trace:
${error.stack}`;

    await navigator.clipboard.writeText(debugInfo);
    toast({
      title: 'Success',
      description: 'Debug information copied to clipboard',
      variant: 'success',
      duration: 3000,
    });
  };

  return (
    <div className="flex h-[100vh] items-center justify-center">
      <ReportNotifier state={state} />
      <ResponsiveContainer
        baseSize="60%"
        className={cn(cardClasses, 'm-10 w-[30rem] p-10 shadow-2xl')}
      >
        <div className="mb-6 flex flex-col items-center justify-center gap-2">
          <Image
            src="/images/robot.svg"
            width={80}
            height={80}
            alt="Error robot"
          />
          <Heading variant="h1" className="text-destructive">
            Something went wrong.
          </Heading>
        </div>
        <Paragraph variant="lead" className="mb-0">
          Fresco encountered an error while trying to load the page, and could
          not continue.
        </Paragraph>
        <Paragraph>
          This error has been automatically reported to us, but if you would
          like to provide further information that you think might be useful
          please use the feedback button. You can also use the rety button to
          attempt to load the page again.
        </Paragraph>

        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={copyDebugInfoToClipboard} variant="ghost">
            Copy Debug Information
            <ClipboardCopy className="ml-2" />
          </Button>
          <FeedbackButton variant="outline" />
          <Button onClick={handleReset} variant="default" className="flex">
            Try Again
          </Button>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
