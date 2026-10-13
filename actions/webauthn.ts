'use server';

import { randomBytes } from 'node:crypto';

import {
  generateAuthenticationOptions as generateAuthOptions,
  generateRegistrationOptions as generateRegOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { cookies } from 'next/headers';

import {
  createAppIntl,
  createMessageError,
  defineMessages,
} from '@codaco/app-i18n/messages';
import { env } from '~/env';
import { isFrescoLocale } from '~/i18n/locales';
import {
  formatPasskeyName,
  getPasskeyActivityValues,
} from '~/i18n/passkeyNames';
import { addEvent } from '~/lib/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { createSessionCookie } from '~/lib/auth/session';
import { getAuthenticatorName } from '~/lib/auth/utils/getAuthenticatorName';
import {
  createChallengeCookie,
  getWebAuthnConfig,
  verifyChallengeCookie,
} from '~/lib/auth/webauthn';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { isAppConfigured } from '~/queries/appSettings';
import { createUsersSchemas } from '~/schemas/users';
import { getClientIp } from '~/utils/getClientIp';
import { passwordMessages } from '~/utils/isStrongPassword';
import { hashPassword, verifyPassword } from '~/utils/password';

// Original audit prose stays in English; structured values localize at display time.
const auditIntl = createAppIntl({ locale: 'en' });

const messages = defineMessages({
  copyChallengeExpiredPleaseTryAgain: {
    id: 'fresco.actions.webauthn.copyChallengeExpiredPleaseTryAgain',
    defaultMessage: 'Challenge expired. Please try again.',
    description:
      'Researcher-facing actions / webauthn: Challenge expired. Please try again.',
  },
  copyRegistrationVerificationFailed2: {
    id: 'fresco.actions.webauthn.copyRegistrationVerificationFailed2',
    defaultMessage: 'Registration verification failed.',
    description:
      'Researcher-facing actions / webauthn: Registration verification failed.',
  },
  copySetupIsAlreadyComplete: {
    id: 'fresco.actions.webauthn.copySetupIsAlreadyComplete',
    defaultMessage: 'Setup is already complete.',
    description:
      'Researcher-facing actions / webauthn: Setup is already complete.',
  },
  copyUsernameMustBeAtLeast4Characters: {
    id: 'fresco.actions.webauthn.copyUsernameMustBeAtLeast4Characters',
    defaultMessage: 'Username must be at least 4 characters.',
    description:
      'Researcher-facing actions / webauthn: Username must be at least 4 characters.',
  },
  copyUsernameAlreadyTaken: {
    id: 'fresco.actions.webauthn.copyUsernameAlreadyTaken',
    defaultMessage: 'Username already taken.',
    description:
      'Researcher-facing actions / webauthn: Username already taken.',
  },
  copyPasskeyNotRecognized: {
    id: 'fresco.actions.webauthn.copyPasskeyNotRecognized',
    defaultMessage: 'Passkey not recognized.',
    description:
      'Researcher-facing actions / webauthn: Passkey not recognized.',
  },
  copyVerificationFailed: {
    id: 'fresco.actions.webauthn.copyVerificationFailed',
    defaultMessage: 'Verification failed.',
    description: 'Researcher-facing actions / webauthn: Verification failed.',
  },
  copyTooManyAttemptsPleaseTryAgainLater: {
    id: 'fresco.actions.webauthn.copyTooManyAttemptsPleaseTryAgainLater',
    defaultMessage: 'Too many attempts. Please try again later.',
    description:
      'Researcher-facing actions / webauthn: Too many attempts. Please try again later.',
  },
  copyAuthenticationFailed: {
    id: 'fresco.actions.webauthn.copyAuthenticationFailed',
    defaultMessage: 'Authentication failed.',
    description: 'Researcher-facing actions / webauthn: Authentication failed.',
  },
  copyPasskeyNotFound: {
    id: 'fresco.actions.webauthn.copyPasskeyNotFound',
    defaultMessage: 'Passkey not found.',
    description: 'Researcher-facing actions / webauthn: Passkey not found.',
  },
  copyCannotRemoveYourOnlyPasskeyWithoutA: {
    id: 'fresco.actions.webauthn.copyCannotRemoveYourOnlyPasskeyWithoutA',
    defaultMessage: 'Cannot remove your only passkey without a password set.',
    description:
      'Researcher-facing actions / webauthn: Cannot remove your only passkey without a password set.',
  },
  copyCannotResetYourOwnAuthentication: {
    id: 'fresco.actions.webauthn.copyCannotResetYourOwnAuthentication',
    defaultMessage: 'Cannot reset your own authentication.',
    description:
      'Researcher-facing actions / webauthn: Cannot reset your own authentication.',
  },
  copyUserNotFound: {
    id: 'fresco.actions.webauthn.copyUserNotFound',
    defaultMessage: 'User not found.',
    description: 'Researcher-facing actions / webauthn: User not found.',
  },
  copyAccountIsAlreadyInPasskeyMode: {
    id: 'fresco.actions.webauthn.copyAccountIsAlreadyInPasskeyMode',
    defaultMessage: 'Account is already in passkey mode.',
    description:
      'Researcher-facing actions / webauthn: Account is already in passkey mode.',
  },
  copyIncorrectPassword: {
    id: 'fresco.actions.webauthn.copyIncorrectPassword',
    defaultMessage: 'Incorrect password.',
    description: 'Researcher-facing actions / webauthn: Incorrect password.',
  },
  copyAccountIsAlreadyInPasswordMode: {
    id: 'fresco.actions.webauthn.copyAccountIsAlreadyInPasswordMode',
    defaultMessage: 'Account is already in password mode.',
    description:
      'Researcher-facing actions / webauthn: Account is already in password mode.',
  },
  passkeyDidNotVerifyUserAtSignIn: {
    id: 'fresco.actions.webauthn.passkeyDidNotVerifyUserAtSignIn',
    defaultMessage:
      'This passkey did not verify your identity. Fresco requires a passkey that confirms who you are with a PIN, fingerprint, or face. Try another passkey, or ask another administrator to reset your authentication.',
    description:
      'Researcher-facing actions / webauthn: sign-in refused because the authenticator skipped user verification; names the two ways back in.',
  },
  passkeyDidNotVerifyUserAtReauth: {
    id: 'fresco.actions.webauthn.passkeyDidNotVerifyUserAtReauth',
    defaultMessage:
      'This passkey did not verify your identity. Add a passkey that confirms who you are with a PIN, fingerprint, or face, then try again.',
    description:
      'Researcher-facing actions / webauthn: an already signed-in researcher re-authenticated with a passkey whose authenticator skipped user verification.',
  },
  passkeyCannotVerifyUserAtRegistration: {
    id: 'fresco.actions.webauthn.passkeyCannotVerifyUserAtRegistration',
    defaultMessage:
      'This passkey cannot verify your identity. Choose a passkey that confirms who you are with a PIN, fingerprint, or face.',
    description:
      'Researcher-facing actions / webauthn: registration refused because the authenticator skipped user verification.',
  },
});

const CHALLENGE_COOKIE_NAME = 'webauthn_challenge';

// @simplewebauthn/server has no structured error codes: a response whose
// authenticator skipped user verification surfaces only as this thrown message
// (`verifyRegistrationResponse` says "was required", `verifyAuthenticationResponse`
// says "required"). `__tests__/user-verification.test.ts` drives the real
// library, so an upstream wording change fails there instead of silently
// downgrading the copy to the generic failure.
const USER_VERIFICATION_FAILURE =
  /^User verification (?:was )?required, but user could not be verified$/;

function isUserVerificationFailure(error: unknown): boolean {
  return (
    error instanceof Error && USER_VERIFICATION_FAILURE.test(error.message)
  );
}

function splitTransports(transports: string | null): string[] | undefined {
  if (!transports) return undefined;
  return transports.split(',');
}

async function setChallengeCookie(challenge: string) {
  const cookieValue = await createChallengeCookie(challenge);
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 300, // 5 minutes
  });
}

async function getAndClearChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
  if (!cookieValue) return null;
  return verifyChallengeCookie(cookieValue);
}

// --- Registration ---

export async function generateRegistrationOptions() {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const existingCredentials = await prisma.webAuthnCredential.findMany({
    where: { user_id: session.user.userId },
    select: { credentialId: true, transports: true },
  });

  const options = await generateRegOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: session.user.username,
    attestationType: config.attestationType,
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credentialId,
      transports: splitTransports(c.transports),
    })),
    authenticatorSelection: config.authenticatorSelection,
  });

  await setChallengeCookie(options.challenge);

  return {
    error: null,
    data: { options },
  };
}

export async function verifyRegistration(data: {
  credential: RegistrationResponseJSON;
}) {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return {
      error: createMessageError(messages.copyChallengeExpiredPleaseTryAgain),
      data: null,
    };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: data.credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: config.requireUserVerification,
    });
  } catch (e) {
    const userVerificationFailed = isUserVerificationFailure(e);
    if (!userVerificationFailed) {
      // eslint-disable-next-line no-console
      console.error('[WebAuthn] Registration verification error:', e);
    }
    return {
      error: createMessageError(
        userVerificationFailed
          ? messages.passkeyCannotVerifyUserAtRegistration
          : messages.copyRegistrationVerificationFailed2,
      ),
      data: null,
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return {
      error: createMessageError(messages.copyRegistrationVerificationFailed2),
      data: null,
    };
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid);
  const passkeyName = { friendlyName, deviceType: credentialDeviceType };

  const newCredential = await prisma.webAuthnCredential.create({
    data: {
      user_id: session.user.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: BigInt(credential.counter),
      transports: credential.transports?.join(',') ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      aaguid,
      friendlyName,
    },
  });

  void addEvent(
    'Passkey Registered',
    `User ${session.user.username} registered a passkey (${formatPasskeyName(auditIntl, passkeyName)})`,
    {
      kind: 'passkeyRegistered',
      values: {
        username: session.user.username,
        ...getPasskeyActivityValues(passkeyName),
      },
    },
  );
  safeUpdateTag('getUsers');

  return {
    error: null,
    data: {
      id: newCredential.id,
      friendlyName: newCredential.friendlyName,
      deviceType: newCredential.deviceType,
      createdAt: newCredential.createdAt,
    },
  };
}

// --- Signup with Passkey (atomic: no session until passkey is verified) ---

export async function generateSignupRegistrationOptions(username: string) {
  // Passkey account creation is also blocked once the app is configured.
  if (await isAppConfigured()) {
    return {
      error: createMessageError(messages.copySetupIsAlreadyComplete),
      data: null,
    };
  }

  if (!username || username.length < 4) {
    return {
      error: createMessageError(messages.copyUsernameMustBeAtLeast4Characters),
      data: null,
    };
  }

  const config = await getWebAuthnConfig();

  const options = await generateRegOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: username,
    attestationType: config.attestationType,
    authenticatorSelection: config.authenticatorSelection,
  });

  await setChallengeCookie(options.challenge);

  return { error: null, data: { options } };
}

export async function signupWithPasskey(data: {
  username: string;
  credential: RegistrationResponseJSON;
  locale?: unknown;
}) {
  const { username, credential, locale } = data;

  if (await isAppConfigured()) {
    return {
      error: createMessageError(messages.copySetupIsAlreadyComplete),
      data: null,
    };
  }

  if (!username || username.length < 4) {
    return {
      error: createMessageError(messages.copyUsernameMustBeAtLeast4Characters),
      data: null,
    };
  }

  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return {
      error: createMessageError(messages.copyChallengeExpiredPleaseTryAgain),
      data: null,
    };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: config.requireUserVerification,
    });
  } catch (e) {
    return {
      error: createMessageError(
        isUserVerificationFailure(e)
          ? messages.passkeyCannotVerifyUserAtRegistration
          : messages.copyRegistrationVerificationFailed2,
      ),
      data: null,
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return {
      error: createMessageError(messages.copyRegistrationVerificationFailed2),
      data: null,
    };
  }

  const {
    credential: verifiedCredential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
  } = verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid);
  const passkeyName = { friendlyName, deviceType: credentialDeviceType };

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username,
        locale: isFrescoLocale(locale) ? locale : null,
        key: {
          create: {
            id: `username:${username}`,
            hashed_password: null,
          },
        },
        webAuthnCredentials: {
          create: {
            credentialId: verifiedCredential.id,
            publicKey: Buffer.from(verifiedCredential.publicKey).toString(
              'base64url',
            ),
            counter: BigInt(verifiedCredential.counter),
            transports: verifiedCredential.transports?.join(',') ?? null,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            aaguid,
            friendlyName,
          },
        },
      },
    });
  } catch {
    return {
      error: createMessageError(messages.copyUsernameAlreadyTaken),
      data: null,
    };
  }

  await createSessionCookie(user.id);

  void addEvent(
    'User Created',
    `User ${username} created an account with a passkey (${formatPasskeyName(auditIntl, passkeyName)})`,
    {
      kind: 'accountCreatedWithPasskey',
      values: { username, ...getPasskeyActivityValues(passkeyName) },
    },
  );

  return { error: null, data: { success: true } };
}

// --- Passkey Reauth ---

export async function verifyPasskeyReauth(data: {
  credential: AuthenticationResponseJSON;
}) {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return {
      error: createMessageError(messages.copyChallengeExpiredPleaseTryAgain),
      data: null,
    };
  }

  const storedCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: data.credential.id },
  });

  if (storedCredential?.user_id !== session.user.userId) {
    return {
      error: createMessageError(messages.copyPasskeyNotRecognized),
      data: null,
    };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: data.credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: config.requireUserVerification,
      credential: {
        id: storedCredential.credentialId,
        publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
        counter: Number(storedCredential.counter),
        transports: splitTransports(storedCredential.transports),
      },
    });
  } catch (e) {
    return {
      error: createMessageError(
        isUserVerificationFailure(e)
          ? messages.passkeyDidNotVerifyUserAtReauth
          : messages.copyVerificationFailed,
      ),
      data: null,
    };
  }

  if (!verification.verified) {
    return {
      error: createMessageError(messages.copyVerificationFailed),
      data: null,
    };
  }

  await prisma.webAuthnCredential.update({
    where: { id: storedCredential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  return { error: null, data: { verified: true } };
}

// --- Authentication ---

export async function generateAuthenticationOptions() {
  const config = await getWebAuthnConfig();

  const options = await generateAuthOptions({
    rpID: config.rpID,
    userVerification: config.authenticatorSelection.userVerification,
  });

  await setChallengeCookie(options.challenge);

  return { error: null, data: { options } };
}

export async function verifyAuthentication(data: {
  credential: AuthenticationResponseJSON;
}) {
  const ipAddress = await getClientIp();

  const rateLimitResult = await checkRateLimit(null, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      error: createMessageError(
        messages.copyTooManyAttemptsPleaseTryAgainLater,
      ),
      data: null,
      rateLimited: true,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return {
      error: createMessageError(messages.copyChallengeExpiredPleaseTryAgain),
      data: null,
    };
  }

  const storedCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: data.credential.id },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!storedCredential) {
    await recordLoginAttempt(null, ipAddress, false);
    return {
      error: createMessageError(messages.copyPasskeyNotRecognized),
      data: null,
    };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: data.credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: config.requireUserVerification,
      credential: {
        id: storedCredential.credentialId,
        publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
        counter: Number(storedCredential.counter),
        transports: splitTransports(storedCredential.transports),
      },
    });
  } catch (e) {
    await recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return {
      error: createMessageError(
        isUserVerificationFailure(e)
          ? messages.passkeyDidNotVerifyUserAtSignIn
          : messages.copyAuthenticationFailed,
      ),
      data: null,
    };
  }

  if (!verification.verified) {
    await recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return {
      error: createMessageError(messages.copyAuthenticationFailed),
      data: null,
    };
  }

  await prisma.webAuthnCredential.update({
    where: { id: storedCredential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  await recordLoginAttempt(storedCredential.user.username, ipAddress, true);
  await createSessionCookie(storedCredential.user.id);

  void addEvent(
    'User Login',
    `User ${storedCredential.user.username} logged in`,
    { kind: 'userLogin', values: { username: storedCredential.user.username } },
  );

  return { error: null, data: { success: true } };
}

// --- Management ---

export async function getUserPasskeys() {
  const session = await requireApiAuth();

  const passkeys = await prisma.webAuthnCredential.findMany({
    where: { user_id: session.user.userId },
    select: {
      id: true,
      friendlyName: true,
      deviceType: true,
      createdAt: true,
      lastUsedAt: true,
      backedUp: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return { error: null, data: passkeys };
}

export async function removePasskey(credentialDbId: string) {
  const session = await requireApiAuth();

  const credential = await prisma.webAuthnCredential.findUnique({
    where: { id: credentialDbId },
  });

  if (credential?.user_id !== session.user.userId) {
    return {
      error: createMessageError(messages.copyPasskeyNotFound),
      data: null,
    };
  }

  const [passkeyCount, key] = await Promise.all([
    prisma.webAuthnCredential.count({
      where: { user_id: session.user.userId },
    }),
    prisma.key.findFirst({
      where: { user_id: session.user.userId },
      select: { hashed_password: true },
    }),
  ]);

  if (passkeyCount <= 1 && !key?.hashed_password) {
    return {
      error: createMessageError(
        messages.copyCannotRemoveYourOnlyPasskeyWithoutA,
      ),
      data: null,
    };
  }

  await prisma.webAuthnCredential.delete({ where: { id: credentialDbId } });

  void addEvent(
    'Passkey Removed',
    `User ${session.user.username} removed a passkey${formatPasskeyName(auditIntl, credential) ? ` (${formatPasskeyName(auditIntl, credential)})` : ''}`,
    {
      kind: 'passkeyRemoved',
      values: {
        username: session.user.username,
        nameMode: formatPasskeyName(auditIntl, credential)
          ? 'named'
          : 'unnamed',
        ...getPasskeyActivityValues(credential),
      },
    },
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}

// --- Admin ---

export async function resetAuthForUser(userId: string) {
  const session = await requireApiAuth();

  if (session.user.userId === userId) {
    return {
      error: createMessageError(messages.copyCannotResetYourOwnAuthentication),
      data: null,
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!targetUser) {
    return { error: createMessageError(messages.copyUserNotFound), data: null };
  }

  const tempPassword = randomBytes(12).toString('base64url');
  const hashedTempPassword = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.webAuthnCredential.deleteMany({ where: { user_id: userId } }),
    prisma.totpCredential.deleteMany({ where: { user_id: userId } }),
    prisma.recoveryCode.deleteMany({ where: { user_id: userId } }),
    prisma.key.updateMany({
      where: { user_id: userId },
      data: { hashed_password: hashedTempPassword },
    }),
  ]);

  void addEvent(
    'Auth Reset',
    `User ${session.user.username} reset authentication for ${targetUser.username}`,
    {
      kind: 'authReset',
      values: { username: session.user.username, target: targetUser.username },
    },
  );
  safeUpdateTag('getUsers');

  return { error: null, data: { temporaryPassword: tempPassword } };
}

// --- Mode Switching ---

export async function switchToPasskeyMode(data: {
  currentPassword: string;
  credential: RegistrationResponseJSON;
}) {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (!key?.hashed_password) {
    return {
      error: createMessageError(messages.copyAccountIsAlreadyInPasskeyMode),
      data: null,
    };
  }

  const valid = await verifyPassword(data.currentPassword, key.hashed_password);
  if (!valid) {
    return {
      error: createMessageError(messages.copyIncorrectPassword),
      data: null,
    };
  }

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return {
      error: createMessageError(messages.copyChallengeExpiredPleaseTryAgain),
      data: null,
    };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: data.credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: config.requireUserVerification,
    });
  } catch (e) {
    const userVerificationFailed = isUserVerificationFailure(e);
    if (!userVerificationFailed) {
      // eslint-disable-next-line no-console
      console.error('[WebAuthn] Registration verification error:', e);
    }
    return {
      error: createMessageError(
        userVerificationFailed
          ? messages.passkeyCannotVerifyUserAtRegistration
          : messages.copyRegistrationVerificationFailed2,
      ),
      data: null,
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return {
      error: createMessageError(messages.copyRegistrationVerificationFailed2),
      data: null,
    };
  }

  const {
    credential: verifiedCredential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
  } = verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid);
  const passkeyName = { friendlyName, deviceType: credentialDeviceType };

  await prisma.$transaction([
    prisma.key.update({
      where: { id: key.id },
      data: { hashed_password: null },
    }),
    prisma.totpCredential.deleteMany({
      where: { user_id: session.user.userId },
    }),
    prisma.recoveryCode.deleteMany({
      where: { user_id: session.user.userId },
    }),
    prisma.webAuthnCredential.create({
      data: {
        user_id: session.user.userId,
        credentialId: verifiedCredential.id,
        publicKey: Buffer.from(verifiedCredential.publicKey).toString(
          'base64url',
        ),
        counter: BigInt(verifiedCredential.counter),
        transports: verifiedCredential.transports?.join(',') ?? null,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        aaguid,
        friendlyName,
      },
    }),
  ]);

  void addEvent(
    'Switched to Passkey Mode',
    `User ${session.user.username} switched to passkey-only authentication (${formatPasskeyName(auditIntl, passkeyName)})`,
    {
      kind: 'switchedToPasskey',
      values: {
        username: session.user.username,
        ...getPasskeyActivityValues(passkeyName),
      },
    },
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}

export async function switchToPasswordMode(newPassword: string) {
  const { strongPasswordSchema } = createUsersSchemas(createMessageError);

  const session = await requireApiAuth();

  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (key?.hashed_password) {
    return {
      error: createMessageError(messages.copyAccountIsAlreadyInPasswordMode),
      data: null,
    };
  }

  // The dialog applies this strength check client-side, but this Server Action
  // is directly invokable — without it, a weak or empty password could replace
  // the account's passkeys.
  const parsedPassword = strongPasswordSchema.safeParse(newPassword);
  if (!parsedPassword.success) {
    return {
      error: createMessageError(passwordMessages.strong),
      data: null,
    };
  }

  const hashed = await hashPassword(parsedPassword.data);

  await prisma.$transaction([
    prisma.key.updateMany({
      where: { user_id: session.user.userId },
      data: { hashed_password: hashed },
    }),
    prisma.webAuthnCredential.deleteMany({
      where: { user_id: session.user.userId },
    }),
  ]);

  void addEvent(
    'Switched to Password Mode',
    `User ${session.user.username} switched to password authentication`,
    { kind: 'switchedToPassword', values: { username: session.user.username } },
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}
