'use client';

import { ClipboardCopy } from 'lucide-react';
import Image from 'next/image';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import Link from '~/components/ui/Link';
import { cx } from '~/utils/cva';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center">
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
          <Heading level="h1" className="text-destructive">
            There&apos;s a problem with Fresco.
          </Heading>
        </div>
        <Paragraph intent="lead" className="mb-0">
          Fresco encountered a serious error and is unable to continue.
        </Paragraph>
        <Paragraph>
          This could indicate a problem with your deployment, or it could be a
          bug in the application. We&apos;ve been notified and will investigate
          the issue, but please feel free to reach out via our{' '}
          <Link href="https://community.networkcanvas.com">
            community website
          </Link>
          .
        </Paragraph>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={copyDebugInfoToClipboard} variant="text">
            {copied ? 'Copied!' : 'Copy Debug Information'}
            <ClipboardCopy className="ml-2" />
          </Button>
          <Button onClick={handleReset} color="primary" className="flex">
            Try Again
          </Button>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
