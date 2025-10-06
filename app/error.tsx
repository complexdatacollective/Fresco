'use client';

import { ClipboardCopy } from 'lucide-react';
import Image from 'next/image';
import ErrorReportNotifier from '~/components/ErrorReportNotifier';
import FeedbackButton from '~/components/Feedback/FeedbackButton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { cx } from '~/utils/cva';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  const { toast } = useToast();

  const handleReset = () => {
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
      <ErrorReportNotifier error={error} />
      <ResponsiveContainer
        baseSize="60%"
        className={cx('shadow-platinum-dark m-10 w-[30rem] p-10 shadow-xl')}
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
        <Paragraph intent="lead" className="mb-0">
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
          <Button onClick={copyDebugInfoToClipboard} variant="outline">
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
