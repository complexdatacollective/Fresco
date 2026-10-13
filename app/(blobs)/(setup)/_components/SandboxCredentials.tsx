'use client';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';

const messages = defineMessages({
  sandboxCredentials: {
    id: 'fresco.SandboxCredentials.sandboxCredentials',
    defaultMessage: 'Sandbox Credentials',
    description: 'Researcher-facing SandboxCredentials: Sandbox Credentials',
  },
  username: {
    id: 'fresco.SandboxCredentials.username',
    defaultMessage: 'Username:',
    description: 'Researcher-facing SandboxCredentials: Username:',
  },
  admin: {
    id: 'fresco.SandboxCredentials.admin',
    defaultMessage: 'admin',
    description: 'Researcher-facing SandboxCredentials: admin',
  },
  password: {
    id: 'fresco.SandboxCredentials.password',
    defaultMessage: 'Password:',
    description: 'Researcher-facing SandboxCredentials: Password:',
  },
  administrator1: {
    id: 'fresco.SandboxCredentials.administrator1',
    defaultMessage: 'Administrator1!',
    description: 'Researcher-facing SandboxCredentials: Administrator1!',
  },
  theSandboxIsASharedExampleEnvironment: {
    id: 'fresco.SandboxCredentials.theSandboxIsASharedExampleEnvironment',
    defaultMessage:
      'The sandbox is a shared example environment not intended for real interviews.',
    description:
      'Researcher-facing SandboxCredentials: The sandbox is a shared example environment not intended for real interviews.',
  },
  allUploadedDataIsPublic: {
    id: 'fresco.SandboxCredentials.allUploadedDataIsPublic',
    defaultMessage: 'All uploaded data is public.',
    description:
      'Researcher-facing SandboxCredentials: All uploaded data is public.',
  },
});

/**
 * Rendered only by sandbox deployments. The `SANDBOX_MODE` check belongs to the
 * server component that renders this one — see `NetlifyBadge` for why.
 */
export default function SandboxCredentials() {
  const intl = useAppIntl();

  return (
    <Alert variant="info">
      <AlertTitle>{intl.formatMessage(messages.sandboxCredentials)}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col space-y-2">
          <div>
            <div>
              <span className="mr-2 font-semibold">
                {intl.formatMessage(messages.username)}
              </span>
              <span>{intl.formatMessage(messages.admin)}</span>
            </div>
            <div>
              <span className="mr-2 font-semibold">
                {intl.formatMessage(messages.password)}
              </span>
              <span>{intl.formatMessage(messages.administrator1)}</span>
            </div>
          </div>

          <div>
            {intl.formatMessage(messages.theSandboxIsASharedExampleEnvironment)}
            <span className="font-semibold">
              {intl.formatMessage(messages.allUploadedDataIsPublic)}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
