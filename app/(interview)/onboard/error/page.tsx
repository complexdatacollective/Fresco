import { defineMessages } from '@codaco/app-i18n/messages';
import { getServerIntl } from '~/i18n/server';

import { ErrorMessage } from '../../interview/_components/ErrorMessage';

export default async function Page() {
  const intl = await getServerIntl();
  return (
    <ErrorMessage
      title={intl.formatMessage(messages.title)}
      message={intl.formatMessage(messages.message)}
    />
  );
}

const messages = defineMessages({
  message: {
    id: 'fresco.participantPages.onboardingError.message',
    defaultMessage:
      'Something went wrong while starting your interview. Please contact the person who recruited you to this study for assistance.',
    description:
      'Participant-facing page shown when an interview link fails to start an interview.',
  },

  title: {
    id: 'fresco.participantPages.onboardingError.title',
    defaultMessage: 'This interview could not be started',
    description:
      'Participant-facing heading shown when an interview link fails to start an interview.',
  },
});
