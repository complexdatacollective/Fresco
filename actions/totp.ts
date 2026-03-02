'use server';

import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  generateQrCodeDataUrl,
  generateRecoveryCodes,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyTotpCode,
} from '~/lib/totp';
import { disableTotpSchema, verifyTotpSetupSchema } from '~/schemas/totp';
import { requireApiAuth } from '~/utils/auth';
import { getBaseUrl } from '~/utils/getBaseUrl';
import { addEvent } from './activityFeed';

export async function enableTotp() {
  try {
    // eslint-disable-next-line no-console
    console.log('[enableTotp] Starting...');
    const session = await requireApiAuth();
    // eslint-disable-next-line no-console
    console.log('[enableTotp] Auth OK, userId:', session.user.userId);

    const secret = generateTotpSecret();
    // eslint-disable-next-line no-console
    console.log('[enableTotp] Secret generated');

    await prisma.totpCredential.upsert({
      where: { user_id: session.user.userId },
      update: {
        secret,
        verified: false,
        createdAt: new Date(),
      },
      create: {
        user_id: session.user.userId,
        secret,
        verified: false,
      },
    });
    // eslint-disable-next-line no-console
    console.log('[enableTotp] DB upsert done');

    const hostname = new URL(getBaseUrl()).hostname;
    const issuer = `Fresco (${hostname})`;
    // eslint-disable-next-line no-console
    console.log('[enableTotp] Generating QR code for issuer:', issuer);

    const qrCodeDataUrl = await generateQrCodeDataUrl(
      generateTotpUri(secret, session.user.username, issuer),
    );
    // eslint-disable-next-line no-console
    console.log(
      '[enableTotp] QR code generated, length:',
      qrCodeDataUrl.length,
    );

    return { error: null, data: { secret, qrCodeDataUrl } };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[enableTotp] FATAL ERROR:', err);
    throw err;
  }
}

export async function verifyTotpSetup(data: unknown) {
  const session = await requireApiAuth();

  const parsed = verifyTotpSetupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid code', data: null };
  }

  const { code } = parsed.data;

  const credential = await prisma.totpCredential.findUnique({
    where: { user_id: session.user.userId },
  });

  if (!credential || credential.verified) {
    return { error: 'No pending TOTP setup found', data: null };
  }

  if (!verifyTotpCode(credential.secret, code)) {
    return { error: 'Invalid verification code', data: null };
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.$transaction([
    prisma.totpCredential.update({
      where: { user_id: session.user.userId },
      data: { verified: true },
    }),
    prisma.recoveryCode.createMany({
      data: recoveryCodes.map((rc) => ({
        user_id: session.user.userId,
        codeHash: hashRecoveryCode(rc),
      })),
    }),
  ]);

  void addEvent(
    'Two-Factor Enabled',
    `User ${session.user.username} enabled two-factor authentication`,
  );
  safeUpdateTag('activityFeed');

  return { error: null, data: { recoveryCodes } };
}

export async function disableTotp(data: unknown) {
  const session = await requireApiAuth();

  const parsed = disableTotpSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid code', data: null };
  }

  const { code } = parsed.data;

  const credential = await prisma.totpCredential.findUnique({
    where: { user_id: session.user.userId },
  });

  if (!credential?.verified) {
    return { error: 'Two-factor authentication is not enabled', data: null };
  }

  if (!verifyTotpCode(credential.secret, code)) {
    return { error: 'Invalid verification code', data: null };
  }

  await prisma.$transaction([
    prisma.totpCredential.delete({
      where: { user_id: session.user.userId },
    }),
    prisma.recoveryCode.deleteMany({
      where: { user_id: session.user.userId },
    }),
  ]);

  void addEvent(
    'Two-Factor Disabled',
    `User ${session.user.username} disabled two-factor authentication`,
  );
  safeUpdateTag('activityFeed');

  return { error: null, data: null };
}

export async function regenerateRecoveryCodes(data: unknown) {
  const session = await requireApiAuth();

  const parsed = verifyTotpSetupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid code', data: null };
  }

  const credential = await prisma.totpCredential.findUnique({
    where: { user_id: session.user.userId },
  });

  if (!credential?.verified) {
    return { error: 'Two-factor authentication is not enabled', data: null };
  }

  if (!verifyTotpCode(credential.secret, parsed.data.code)) {
    return { error: 'Invalid verification code', data: null };
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({
      where: { user_id: session.user.userId },
    }),
    prisma.recoveryCode.createMany({
      data: recoveryCodes.map((rc) => ({
        user_id: session.user.userId,
        codeHash: hashRecoveryCode(rc),
      })),
    }),
  ]);

  void addEvent(
    'Recovery Codes Regenerated',
    `User ${session.user.username} regenerated recovery codes`,
  );
  safeUpdateTag('activityFeed');

  return { error: null, data: { recoveryCodes } };
}

export async function resetTotpForUser(userId: string) {
  const session = await requireApiAuth();

  if (session.user.userId === userId) {
    return {
      error: 'Cannot reset your own two-factor authentication',
      data: null,
    };
  }

  await prisma.$transaction([
    prisma.totpCredential.deleteMany({
      where: { user_id: userId },
    }),
    prisma.recoveryCode.deleteMany({
      where: { user_id: userId },
    }),
  ]);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  void addEvent(
    'Two-Factor Reset',
    `User ${session.user.username} reset two-factor authentication for ${targetUser?.username ?? userId}`,
  );
  safeUpdateTag('activityFeed');
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}
