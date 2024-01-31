'use client';

import { Button } from '~/components/ui/Button';
import { memo, useEffect, useState } from 'react';
import { trackEvent } from '~/analytics/utils';
import { cn } from '~/utils/shadcn';
import Image from 'next/image';
import { env } from '~/env.mjs';
import { AnimatePresence, motion } from 'framer-motion';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { cardClasses } from '~/components/ui/card';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import FeedbackButton from '~/components/Feedback/FeedbackButton';
import { CheckIcon, ClipboardCopy, Cross, Loader2 } from 'lucide-react';
import { useToast } from '~/components/ui/use-toast';
import { Divider } from '~/components/ui/Divider';

const AnimatedTaskButton = memo(
  ({
    startOnMount = false,
    task,
    idleLabel = 'Start',
    loadingLabel = 'Loading...',
    successLabel = 'Done!',
    errorLabel = 'Error!',
  }: {
    startOnMount?: boolean;
    task: () => Promise<void>;
    idleLabel?: string;
    loadingLabel?: string;
    successLabel?: string;
    errorLabel?: string;
  }) => {
    const [state, setState] = useState<
      'idle' | 'loading' | 'success' | 'error'
    >(startOnMount ? 'loading' : 'idle');

    const start = async () => {
      setState('loading');
      try {
        await task();
        setState('success');
      } catch (error) {
        setState('error');
      }
    };

    useEffect(() => {
      if (startOnMount) {
        void start();
      }
    });

    const labelAnimationVariants = {
      hidden: { opacity: 0, y: '-100%' },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: '100%' },
    };

    const getButtonContent = () => {
      switch (state) {
        case 'idle':
          return (
            <motion.div
              key="idle"
              variants={labelAnimationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {idleLabel}
            </motion.div>
          );
        case 'loading':
          return (
            <motion.div
              key="loading"
              variants={labelAnimationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Loader2 className="animate-spin" />
              {loadingLabel}
            </motion.div>
          );
        case 'success':
          return (
            <motion.div
              key="success"
              variants={labelAnimationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CheckIcon className="text-success" />
              {successLabel}
            </motion.div>
          );
        case 'error':
          return (
            <motion.div
              key="error"
              variants={labelAnimationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Cross className="text-destructive" />
              {errorLabel}
            </motion.div>
          );
      }
    };

    return (
      <Button
        onClick={start}
        disabled={state === 'loading' || state === 'success'}
        variant="ghost"
      >
        <AnimatePresence mode="wait" initial={false}>
          {getButtonContent()}
        </AnimatePresence>
      </Button>
    );
  },
);

AnimatedTaskButton.displayName = 'AnimatedTaskButton';

export default function Error({
  error,
  reset,
  heading,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  const { toast } = useToast();

  const sendEvent = () =>
    trackEvent({
      type: 'Error',
      error: {
        message: error.message,
        details: heading ?? '',
        stacktrace: error.stack ?? '',
        path: window.location.pathname,
      },
    });

  const copyDebugInfoToClipboard = async () => {
    const debugInfo = `
Error: ${error.message}
Path: ${window.location.pathname}
User Agent: ${navigator.userAgent}
Stack Trace:
${error.stack}`;

    await navigator.clipboard.writeText(debugInfo);
    toast({
      description: 'Debug information copied to clipboard',
      variant: 'success',
      duration: 3000,
    });
  };

  return (
    <div className="flex h-[100vh] items-center justify-center">
      <div className="absolute right-10 top-10">
        <AnimatedTaskButton
          task={() => sendEvent()}
          startOnMount={true}
          successLabel="Error anonymously reported!"
          loadingLabel="Sending error information..."
        />
      </div>
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
          <Button onClick={reset} variant="default" className="flex">
            Try Again
          </Button>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
