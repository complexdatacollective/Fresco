import { type BrowserContext, type CDPSession } from '@playwright/test';

type VirtualAuthenticator = {
  authenticatorId: string;
  cdpSession: CDPSession;
  remove: () => Promise<void>;
};

export async function createVirtualAuthenticator(
  context: BrowserContext,
): Promise<VirtualAuthenticator> {
  const cdpSession = await context.newCDPSession(context.pages()[0]!);

  await cdpSession.send('WebAuthn.enable');

  const { authenticatorId } = await cdpSession.send(
    'WebAuthn.addVirtualAuthenticator',
    {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );

  return {
    authenticatorId,
    cdpSession,
    remove: async () => {
      await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
        authenticatorId,
      });
      await cdpSession.send('WebAuthn.disable');
      await cdpSession.detach();
    },
  };
}

export async function getCredentialCount(
  authenticator: VirtualAuthenticator,
): Promise<number> {
  const { credentials } = await authenticator.cdpSession.send(
    'WebAuthn.getCredentials',
    { authenticatorId: authenticator.authenticatorId },
  );
  return credentials.length;
}
