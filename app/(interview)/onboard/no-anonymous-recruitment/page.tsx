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
    id: 'fresco.participantPages.anonymousRecruitmentDisabled.message',
    defaultMessage:
      'Anonymous recruitment is disabled for this study. Researchers may optionally enable anonymous recruitment from the dashboard.',
    description:
      'Shown when an anonymous interview link is opened while the deployment does not allow anonymous recruitment. Seen by participants, and by researchers testing their links.',
  },

  title: {
    id: 'fresco.participantPages.anonymousRecruitmentDisabled.title',
    defaultMessage: 'Anonymous Recruitment Disabled',
    description:
      'Heading shown when an anonymous interview link is opened while the deployment does not allow anonymous recruitment.',
  },
});
