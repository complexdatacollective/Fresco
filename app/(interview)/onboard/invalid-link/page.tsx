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
    id: 'fresco.participantPages.invalidLink.message',
    defaultMessage:
      'The study this link points to is not available. Please contact the person who recruited you to this study for assistance.',
    description:
      'Participant-facing page shown when an interview link points to a study that no longer exists.',
  },

  title: {
    id: 'fresco.participantPages.invalidLink.title',
    defaultMessage: 'This interview link is no longer valid',
    description:
      'Participant-facing heading shown when an interview link points to a study that no longer exists.',
  },
});
