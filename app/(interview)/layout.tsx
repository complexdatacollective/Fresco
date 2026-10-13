import { type Metadata } from 'next';

import { defineMessages } from '@codaco/app-i18n/messages';
import { ThemedRegion } from '@codaco/fresco-ui/ThemedRegion';
import EndSessionRecording from '~/app/(interview)/_components/EndSessionRecording';
import { getServerIntl } from '~/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const intl = await getServerIntl();
  return {
    title: intl.formatMessage(messages.pageTitle),
    description: intl.formatMessage(messages.pageDescription),
  };
}

// The participant routes read the request's language from the root provider,
// as the interview's own messages do: an interview that opens in French must
// not refuse to open, or thank the participant, in English. Language and
// direction are inherited from <html>.
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemedRegion
      theme="interview"
      className="flex h-screen max-h-screen flex-col"
    >
      <EndSessionRecording />
      {children}
    </ThemedRegion>
  );
}

export default RootLayout;

const messages = defineMessages({
  pageDescription: {
    id: 'fresco.participantPages.metadata.pageDescription',
    defaultMessage: 'Interview',
    description:
      'Participant-facing interview pages, page description metadata: Interview',
  },

  pageTitle: {
    id: 'fresco.participantPages.metadata.pageTitle',
    defaultMessage: 'Network Canvas Fresco - Interview',
    description:
      'Participant-facing interview pages, browser tab title. "Network Canvas Fresco" is the product name and is not translated.',
  },
});
