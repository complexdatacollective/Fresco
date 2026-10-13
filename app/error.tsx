'use client';

import { ClipboardCopy } from 'lucide-react';
import { useEffect } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { AppMessage, useAppIntl } from '@codaco/app-i18n/react';
import { Button } from '@codaco/fresco-ui/Button';
import Surface from '@codaco/fresco-ui/layout/Surface';
import { useToast } from '@codaco/fresco-ui/Toast';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { captureClientException } from '~/lib/posthog-client';

const messages = defineMessages({
  success: {
    id: 'fresco.error.success',
    defaultMessage: 'Success',
    description: 'Researcher-facing error: Success',
  },
  debugInformationCopiedToClipboard: {
    id: 'fresco.error.debugInformationCopiedToClipboard',
    defaultMessage: 'Debug information copied to clipboard',
    description:
      'Researcher-facing error: Debug information copied to clipboard',
  },
  frescoEncounteredAnErrorWhileTryingTo: {
    id: 'fresco.error.frescoEncounteredAnErrorWhileTryingTo',
    defaultMessage:
      'Fresco encountered an error while trying to load the page, and could not continue.',
    description:
      'Researcher-facing error: Fresco encountered an error while trying to load the page, and could not continue.',
  },
  thisErrorHasBeenAutomaticallyReportedTo: {
    id: 'fresco.error.thisErrorHasBeenAutomaticallyReportedTo',
    defaultMessage:
      'This error has been automatically reported to us, but if you would like to provide further information that you think might be useful please contact us. You can also use the retry button to attempt to load the page again.',
    description:
      'Researcher-facing error: This error has been automatically reported to us, but if you would like to provide further information that you think mi',
  },
  copyDebugInformation: {
    id: 'fresco.error.copyDebugInformation',
    defaultMessage: 'Copy Debug Information',
    description: 'Researcher-facing error: Copy Debug Information',
  },
});

export default function Error({
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

  const { add } = useToast();

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
    add({
      title: <AppMessage message={messages.success} />,
      description: (
        <AppMessage message={messages.debugInformationCopiedToClipboard} />
      ),
      variant: 'success',
    });
  };

  useEffect(() => {
    captureClientException(
      error,
      error.digest === undefined ? undefined : { digest: error.digest },
    );
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Surface baseSize="60%" maxWidth="3xl">
        <Heading level="h1" className="text-destructive">
          {intl.formatMessage(commonMessages.genericError)}
        </Heading>
        <Paragraph intent="lead">
          {intl.formatMessage(messages.frescoEncounteredAnErrorWhileTryingTo)}
        </Paragraph>
        <Paragraph>
          {intl.formatMessage(messages.thisErrorHasBeenAutomaticallyReportedTo)}
        </Paragraph>
        <hr className="tablet-landscape:block hidden" />
        <div className="tablet-landscape:flex-row tablet-landscape:justify-between flex flex-col gap-2">
          <Button onClick={copyDebugInfoToClipboard} icon={<ClipboardCopy />}>
            {intl.formatMessage(messages.copyDebugInformation)}
          </Button>
          <Button onClick={handleReset} color="primary" className="flex">
            {intl.formatMessage(commonMessages.retry)}
          </Button>
        </div>
      </Surface>
    </div>
  );
}
