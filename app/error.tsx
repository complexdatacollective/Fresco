'use client';

import { ClipboardCopy } from 'lucide-react';
import ErrorReportNotifier from '~/components/ErrorReportNotifier';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';

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
      <ResponsiveContainer baseSize="60%">
        <Surface>
          <Heading level="h1" className="text-destructive">
            Something went wrong.
          </Heading>
          <Paragraph intent="lead">
            Fresco encountered an error while trying to load the page, and could
            not continue.
          </Paragraph>
          <Paragraph>
            This error has been automatically reported to us, but if you would
            like to provide further information that you think might be useful
            please contact us. You can also use the retry button to attempt to
            load the page again.
          </Paragraph>
          <hr className="tablet:block hidden" />
          <div className="tablet:flex-row tablet:justify-between flex flex-col gap-2">
            <Button
              onClick={copyDebugInfoToClipboard}
              variant="outline"
              icon={<ClipboardCopy />}
            >
              Copy Debug Information
            </Button>
            <Button onClick={handleReset} variant="default" className="flex">
              Try Again
            </Button>
          </div>
        </Surface>
      </ResponsiveContainer>
    </div>
  );
}
