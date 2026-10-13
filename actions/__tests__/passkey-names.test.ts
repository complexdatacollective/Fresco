import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppIntl } from '@codaco/app-i18n/messages';
import {
  removePasskey,
  signupWithPasskey,
  switchToPasskeyMode,
  verifyRegistration,
} from '~/actions/webauthn';
import { formatActivityDetails } from '~/i18n/activityDetails';
import { frescoCatalogSource } from '~/src/locales/catalogs';

vi.mock('server-only', () => ({}));
const { verify, createCredential, createUser, findCredential, addEvent } =
  vi.hoisted(() => ({
    verify: vi.fn(),
    createCredential: vi.fn(),
    createUser: vi.fn(),
    findCredential: vi.fn(),
    addEvent: vi.fn(),
  }));
vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
  verifyRegistrationResponse: verify,
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({ value: 'signed-challenge' }),
    delete: vi.fn(),
  }),
}));
vi.mock('~/env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('~/lib/auth/guards', () => ({
  requireApiAuth: async () => ({
    user: { userId: 'user-1', username: 'Researcher' },
  }),
}));
vi.mock('~/lib/auth/session', () => ({ createSessionCookie: vi.fn() }));
vi.mock('~/lib/auth/webauthn', () => ({
  createChallengeCookie: vi.fn(),
  verifyChallengeCookie: async () => 'challenge',
  getWebAuthnConfig: async () => ({
    origin: 'https://example.test',
    rpID: 'example.test',
    requireUserVerification: true,
  }),
}));
vi.mock('~/lib/db', () => ({
  prisma: {
    webAuthnCredential: {
      create: createCredential,
      findUnique: findCredential,
      count: async () => 2,
      delete: vi.fn(),
    },
    user: { create: createUser },
    key: {
      findFirst: async () => ({ id: 'key-1', hashed_password: 'hash' }),
      update: vi.fn(),
    },
    totpCredential: { deleteMany: vi.fn() },
    recoveryCode: { deleteMany: vi.fn() },
    $transaction: async (writes: Promise<unknown>[]) => Promise.all(writes),
  },
}));
vi.mock('~/lib/activityFeed', () => ({ addEvent }));
vi.mock('~/lib/cache', () => ({ safeUpdateTag: vi.fn() }));
vi.mock('~/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
  recordLoginAttempt: vi.fn(),
}));
vi.mock('~/queries/appSettings', () => ({
  isAppConfigured: async () => false,
}));
vi.mock('~/utils/getClientIp', () => ({ getClientIp: vi.fn() }));
vi.mock('~/utils/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: async () => true,
}));

// Loaded up front, so the Spanish formatter below is synchronous.
const es = await frescoCatalogSource.load('es');

const credential: RegistrationResponseJSON = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  response: { clientDataJSON: 'fixture', attestationObject: 'fixture' },
  clientExtensionResults: {},
};

beforeEach(() => {
  vi.resetAllMocks();
  createUser.mockResolvedValue({ id: 'user-1' });
  createCredential.mockResolvedValue({
    id: 'credential-1',
    friendlyName: null,
    deviceType: 'multiDevice',
    createdAt: new Date(),
  });
});

it('records device identity when removing a passkey with a generated name', async () => {
  findCredential.mockResolvedValue({
    user_id: 'user-1',
    friendlyName: null,
    deviceType: 'singleDevice',
  });
  const result = await removePasskey('credential-1');
  expect(result.error).toBeNull();
  expect(addEvent).toHaveBeenCalledWith(
    'Passkey Removed',
    'User Researcher removed a passkey (Security key)',
    {
      kind: 'passkeyRemoved',
      values: {
        username: 'Researcher',
        nameMode: 'named',
        passkey: '',
        passkeyDeviceType: 'singleDevice',
      },
    },
  );
});

it.each([
  [undefined, null],
  [null, null],
  ['es', 'es'],
  ['en-GB', 'en-GB'],
  ['unsupported', null],
  [42, null],
])(
  'preserves the explicit setup preference %s during passkey account creation',
  async (locale, expected) => {
    verify.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'credential-id',
          publicKey: new Uint8Array([1]),
          counter: 0,
        },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: false,
        aaguid: 'unknown',
      },
    });
    const result = await signupWithPasskey({
      username: 'Researcher',
      credential,
      locale,
    });
    expect(result.error).toBeNull();
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: expected }),
      }),
    );
  },
);

describe.each(['additional', 'signup', 'switch'])(
  '%s passkey registration names',
  (path) => {
    it.each([
      {
        aaguid: 'unknown',
        deviceType: 'multiDevice',
        friendlyName: null,
        englishName: 'Synced passkey',
        spanishName: 'Llave de acceso sincronizada',
      },
      {
        aaguid: 'unknown',
        deviceType: 'singleDevice',
        friendlyName: null,
        englishName: 'Security key',
        spanishName: 'Llave de seguridad',
      },
      {
        aaguid: 'adce0002-35bc-c60a-648b-0b25f1f05503',
        deviceType: 'multiDevice',
        friendlyName: 'Chrome on Mac',
        englishName: 'Chrome on Mac',
        spanishName: 'Chrome on Mac',
      },
    ])(
      'stores identity for $aaguid / $deviceType and localizes only generic activity names',
      async ({
        aaguid,
        deviceType,
        friendlyName,
        englishName,
        spanishName,
      }) => {
        verify.mockResolvedValue({
          verified: true,
          registrationInfo: {
            credential: {
              id: 'credential-id',
              publicKey: new Uint8Array([1]),
              counter: 0,
            },
            credentialDeviceType: deviceType,
            credentialBackedUp: false,
            aaguid,
          },
        });
        const result =
          path === 'additional'
            ? await verifyRegistration({ credential })
            : path === 'signup'
              ? await signupWithPasskey({ username: 'Researcher', credential })
              : await switchToPasskeyMode({
                  currentPassword: 'fixture',
                  credential,
                });
        expect(result.error).toBeNull();
        const storedName = expect.objectContaining({
          friendlyName,
          deviceType,
          aaguid,
        });
        if (path === 'signup') {
          expect(createUser).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                webAuthnCredentials: { create: storedName },
              }),
            }),
          );
        } else {
          expect(createCredential).toHaveBeenCalledWith({ data: storedName });
        }
        expect(addEvent).toHaveBeenCalledOnce();
        const original = addEvent.mock.calls[0]?.[1];
        expect(original).toEqual(expect.stringContaining(englishName));
        const localization = addEvent.mock.calls[0]?.[2];
        const activity = { message: 'original record', localization };
        expect(
          formatActivityDetails(
            createAppIntl({ locale: 'es', messages: es }),
            activity,
          ),
        ).toContain(spanishName);
        expect(
          formatActivityDetails(createAppIntl({ locale: 'en' }), activity),
        ).toContain(englishName);
        if (friendlyName === null)
          expect(localization).toMatchObject({
            values: { passkey: '', passkeyDeviceType: deviceType },
          });
        else
          expect(localization).toMatchObject({
            values: { passkey: friendlyName },
          });
      },
    );
  },
);
