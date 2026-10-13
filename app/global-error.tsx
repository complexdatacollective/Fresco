'use client';
import { ClipboardCopy } from 'lucide-react';
import Image from 'next/image';
import { type ReactNode, useEffect, useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Button } from '@codaco/fresco-ui/Button';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import Link from '~/components/Link';
import RecoveryI18nProvider from '~/i18n/RecoveryI18nProvider';
import { captureClientException } from '~/lib/posthog-client';

const messages = defineMessages({
  copyCopied: {
    id: 'fresco.globalerror.copyCopied',
    defaultMessage: 'Copied!',
    description: 'Researcher-facing globalerror: Copied!',
  },
  copyCopyDebugInformation: {
    id: 'fresco.globalerror.copyCopyDebugInformation',
    defaultMessage: 'Copy Debug Information',
    description: 'Researcher-facing globalerror: Copy Debug Information',
  },
  errorRobot: {
    id: 'fresco.globalerror.errorRobot',
    defaultMessage: 'Error robot',
    description: 'Researcher-facing globalerror: Error robot',
  },
  thereAposSAProblemWithFresco: {
    id: 'fresco.globalerror.thereAposSAProblemWithFresco',
    defaultMessage: "There's a problem with Fresco.",
    description:
      "Researcher-facing globalerror: There's a problem with Fresco.",
  },
  frescoEncounteredASeriousErrorAndIs: {
    id: 'fresco.globalerror.frescoEncounteredASeriousErrorAndIs',
    defaultMessage:
      'Fresco encountered a serious error and is unable to continue.',
    description:
      'Researcher-facing globalerror: Fresco encountered a serious error and is unable to continue.',
  },
  thisCouldIndicateAProblemWithYour: {
    id: 'fresco.globalerror.thisCouldIndicateAProblemWithYour',
    defaultMessage:
      "This could indicate a problem with your deployment, or it could be a bug in the application. We've been notified and will investigate the issue, but please feel free to reach out via our <tag1> community website </tag1> .",
    description:
      "Researcher-facing globalerror: This could indicate a problem with your deployment, or it could be a bug in the application. We've been notified an",
  },
});

const renderCommunityLinkChunks = (chunks: ReactNode[]) => (
  <Link href="https://community.networkcanvas.com">{chunks}</Link>
);

function ErrorContent({
  error,
  reset,
}: {
  // Next adds `digest` to an error it forwarded from the server. In production
  // that digest is all there is: React's #441 carries no message.
  error: Error & { digest?: string };
  reset: () => void;
  heading?: string;
}) {
  const intl = useAppIntl();

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
    captureClientException(
      error,
      error.digest === undefined ? undefined : { digest: error.digest },
    );
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Surface>
        <div className="mb-6 flex flex-col items-center justify-center gap-2">
          <Image
            src="/images/robot.svg"
            width={80}
            height={80}
            alt={intl.formatMessage(messages.errorRobot)}
          />
          <Heading level="h1" className="text-destructive">
            {intl.formatMessage(messages.thereAposSAProblemWithFresco)}
          </Heading>
        </div>
        <Paragraph intent="lead" className="mb-0">
          {intl.formatMessage(messages.frescoEncounteredASeriousErrorAndIs)}
        </Paragraph>
        <Paragraph>
          {intl.formatMessage(messages.thisCouldIndicateAProblemWithYour, {
            tag1: renderCommunityLinkChunks,
          })}
        </Paragraph>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={copyDebugInfoToClipboard} variant="text">
            {copied
              ? intl.formatMessage(messages.copyCopied)
              : intl.formatMessage(messages.copyCopyDebugInformation)}
            <ClipboardCopy className="ml-2" />
          </Button>
          <Button onClick={handleReset} color="primary" className="flex">
            {intl.formatMessage(commonMessages.retry)}
          </Button>
        </div>
      </Surface>
    </div>
  );
}

export default function GlobalError(props: {
  error: Error;
  reset: () => void;
}) {
  return (
    <RecoveryI18nProvider>
      <ErrorContent {...props} />
    </RecoveryI18nProvider>
  );
}
