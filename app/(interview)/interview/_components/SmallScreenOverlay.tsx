import { env } from 'node:process';

import Image from 'next/image';
import { connection } from 'next/server';
import type { ReactNode } from 'react';

import { defineMessages } from '@codaco/app-i18n/messages';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { getServerIntl } from '~/i18n/server';
import { getAppSetting } from '~/queries/appSettings';

const renderStrongChunks = (chunks: ReactNode[]) => <strong>{chunks}</strong>;

const SmallScreenOverlay = async () => {
  await connection();
  const disableSmallScreenOverlay = await getAppSetting(
    'disableSmallScreenOverlay',
  );
  if (disableSmallScreenOverlay || env.NODE_ENV === 'development') {
    return null;
  }

  const intl = await getServerIntl();

  return (
    <div className="laptop:hidden bg-background fixed inset-0 z-50 flex items-center justify-center">
      <div className="flex max-w-[72ch] flex-col items-center justify-center p-6 text-center">
        <Image
          src="/images/too-small.svg"
          width={300}
          height={300}
          alt=""
          aria-hidden
        />
        <Heading level="h1">{intl.formatMessage(messages.title)}</Heading>
        <Paragraph intent="lead">
          {intl.formatMessage(messages.message)}
        </Paragraph>
        <Paragraph intent="smallText" className="mt-10">
          {intl.formatMessage(messages.mobileNote, {
            strong: renderStrongChunks,
          })}
        </Paragraph>
      </div>
    </div>
  );
};

export default SmallScreenOverlay;

const messages = defineMessages({
  message: {
    id: 'fresco.participantPages.smallScreen.message',
    defaultMessage:
      'To complete this interview, please use a device with a larger screen, or maximize your browser window.',
    description:
      'Participant-facing paragraph on the overlay that covers an interview when the screen is too small to show it.',
  },

  mobileNote: {
    id: 'fresco.participantPages.smallScreen.mobileNote',
    defaultMessage:
      '<strong>Note:</strong> it is not possible to complete this interview using a mobile phone.',
    description:
      'Small print on the overlay that covers an interview when the screen is too small. <strong> marks the word "Note" in bold.',
  },

  title: {
    id: 'fresco.participantPages.smallScreen.title',
    defaultMessage: 'Screen Size Too Small',
    description:
      'Heading of the overlay that covers an interview when the participant’s screen is too small to show it.',
  },
});
