'use server';

import { randomBytes } from 'node:crypto';
import {
  generateAuthenticationOptions as generateAuthOptions,
  generateRegistrationOptions as generateRegOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { cookies } from 'next/headers';
import { env } from '~/env';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { createSessionCookie } from '~/lib/session';
import { generateRecoveryCodes, hashRecoveryCode } from '~/lib/totp';
import {
  createChallengeCookie,
  getWebAuthnConfig,
  verifyChallengeCookie,
} from '~/lib/webauthn';
import { requireApiAuth } from '~/utils/auth';
import { getClientIp } from '~/utils/getClientIp';
import { hashPassword, verifyPassword } from '~/utils/password';
import { getAuthenticatorName } from '~/lib/webauthn/getAuthenticatorName';
import { addEvent } from './activityFeed';

const CHALLENGE_COOKIE_NAME = 'webauthn_challenge';

function splitTransports(
  transports: string | null,
): AuthenticatorTransportFuture[] | undefined {
  if (!transports) return undefined;
  return transports.split(',') as AuthenticatorTransportFuture[];
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
    return { error: 'Challenge expired. Please try again.', data: null };
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
    const message = e instanceof Error ? e.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('[WebAuthn] Registration verification error:', message);
    return {
      error: `Registration verification failed: ${message}`,
      data: null,
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: 'Registration verification failed.', data: null };
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid, credentialDeviceType);

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
    `User ${session.user.username} registered a passkey (${friendlyName})`,
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
  if (!username || username.length < 4) {
    return { error: 'Username must be at least 4 characters.', data: null };
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
}) {
  const { username, credential } = data;

  if (!username || username.length < 4) {
    return { error: 'Username must be at least 4 characters.', data: null };
  }

  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return { error: 'Challenge expired. Please try again.', data: null };
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
  } catch {
    return { error: 'Registration verification failed.', data: null };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: 'Registration verification failed.', data: null };
  }

  const {
    credential: verifiedCredential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
  } = verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid, credentialDeviceType);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username,
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
    return { error: 'Username already taken.', data: null };
  }

  await createSessionCookie(user.id);

  void addEvent(
    'User Created',
    `User ${username} created an account with a passkey (${friendlyName})`,
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
    return { error: 'Challenge expired. Please try again.', data: null };
  }

  const storedCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: data.credential.id },
  });

  if (storedCredential?.user_id !== session.user.userId) {
    return { error: 'Passkey not recognized.', data: null };
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
  } catch {
    return { error: 'Verification failed.', data: null };
  }

  if (!verification.verified) {
    return { error: 'Verification failed.', data: null };
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
      error: 'Too many attempts. Please try again later.',
      data: null,
      rateLimited: true,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return { error: 'Challenge expired. Please try again.', data: null };
  }

  const storedCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: data.credential.id },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!storedCredential) {
    void recordLoginAttempt(null, ipAddress, false);
    return { error: 'Passkey not recognized.', data: null };
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
  } catch {
    void recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return { error: 'Authentication failed.', data: null };
  }

  if (!verification.verified) {
    void recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return { error: 'Authentication failed.', data: null };
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
    'Passkey Login',
    `User ${storedCredential.user.username} logged in with a passkey`,
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
    return { error: 'Passkey not found.', data: null };
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
      error: 'Cannot remove your only passkey without a password set.',
      data: null,
    };
  }

  await prisma.webAuthnCredential.delete({ where: { id: credentialDbId } });

  void addEvent(
    'Passkey Removed',
    `User ${session.user.username} removed a passkey${credential.friendlyName ? ` (${credential.friendlyName})` : ''}`,
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}

export async function removePassword(currentPassword: string) {
  const session = await requireApiAuth();

  const passkeyCount = await prisma.webAuthnCredential.count({
    where: { user_id: session.user.userId },
  });

  if (passkeyCount === 0) {
    return {
      error: 'Register a passkey before removing your password.',
      data: null,
    };
  }

  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (!key?.hashed_password) {
    return { error: 'No password is set.', data: null };
  }

  const valid = await verifyPassword(currentPassword, key.hashed_password);
  if (!valid) {
    return { error: 'Incorrect password.', data: null };
  }

  const existingCodes = await prisma.recoveryCode.count({
    where: { user_id: session.user.userId, usedAt: null },
  });

  let recoveryCodes: string[] | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.key.update({
      where: { id: key.id },
      data: { hashed_password: null },
    });

    if (existingCodes === 0) {
      recoveryCodes = generateRecoveryCodes();
      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((rc) => ({
          user_id: session.user.userId,
          codeHash: hashRecoveryCode(rc),
        })),
      });
    }
  });

  void addEvent(
    'Password Removed',
    `User ${session.user.username} removed their password (passkey-only)`,
  );

  return { error: null, data: { recoveryCodes } };
}

export async function setPassword(newPassword: string) {
  const session = await requireApiAuth();

  const hashed = await hashPassword(newPassword);

  await prisma.key.updateMany({
    where: { user_id: session.user.userId },
    data: { hashed_password: hashed },
  });

  void addEvent('Password Set', `User ${session.user.username} set a password`);

  return { error: null, data: null };
}

// --- Admin ---

export async function resetAuthForUser(userId: string) {
  const session = await requireApiAuth();

  if (session.user.userId === userId) {
    return { error: 'Cannot reset your own authentication.', data: null };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!targetUser) {
    return { error: 'User not found.', data: null };
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
    return { error: 'Account is already in passkey mode.', data: null };
  }

  const valid = await verifyPassword(data.currentPassword, key.hashed_password);
  if (!valid) {
    return { error: 'Incorrect password.', data: null };
  }

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return { error: 'Challenge expired. Please try again.', data: null };
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
    const message = e instanceof Error ? e.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('[WebAuthn] Registration verification error:', message);
    return {
      error: `Registration verification failed: ${message}`,
      data: null,
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: 'Registration verification failed.', data: null };
  }

  const {
    credential: verifiedCredential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
  } = verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid, credentialDeviceType);

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
    `User ${session.user.username} switched to passkey-only authentication (${friendlyName})`,
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}

export async function switchToPasswordMode(newPassword: string) {
  const session = await requireApiAuth();

  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (key?.hashed_password) {
    return { error: 'Account is already in password mode.', data: null };
  }

  const hashed = await hashPassword(newPassword);

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
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}
