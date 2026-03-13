'use server';

import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { createSessionCookie } from '~/lib/session';
import {
  hashRecoveryCode,
  verifyTotpCode,
  verifyTwoFactorToken,
} from '~/lib/totp';
import { getInstallationId } from '~/queries/appSettings';
import { verifyTwoFactorSchema } from '~/schemas/totp';
import { getClientIp } from '~/utils/getClientIp';
import { addEvent } from './activityFeed';

const TOTP_CODE_PATTERN = /^\d{6}$/;
const RECOVERY_CODE_PATTERN = /^[0-9a-f]{20}$/;

export async function verifyTwoFactor(
  data: unknown,
): Promise<FormSubmissionResult> {
  const parsed = verifyTwoFactorSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, formErrors: ['Invalid submission'] };
  }

  const { twoFactorToken, code } = parsed.data;

  const installationId = await getInstallationId();
  if (!installationId) {
    return {
      success: false,
      formErrors: ['Server configuration error. Please contact an admin.'],
    };
  }
  const tokenResult = verifyTwoFactorToken(twoFactorToken, installationId);
  if (!tokenResult.valid) {
    return {
      success: false,
      formErrors: ['Two-factor session expired. Please sign in again.'],
    };
  }

  const { userId } = tokenResult;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user) {
    return { success: false, formErrors: ['User not found'] };
  }

  const ipAddress = await getClientIp();
  const rateLimitResult = await checkRateLimit(user.username, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      formErrors: ['Too many attempts. Please sign in again.'],
    };
  }

  const credential = await prisma.totpCredential.findFirst({
    where: { user_id: userId, verified: true },
  });

  if (!credential) {
    return {
      success: false,
      formErrors: ['Two-factor authentication is not configured'],
    };
  }

  const isTotpCode = TOTP_CODE_PATTERN.test(code);
  const isRecoveryCode = RECOVERY_CODE_PATTERN.test(code);

  if (isTotpCode) {
    if (!verifyTotpCode(credential.secret, code)) {
      void recordLoginAttempt(user.username, ipAddress, false);
      return { success: false, formErrors: ['Invalid verification code'] };
    }

    await createSessionCookie(userId);

    void addEvent('Two-Factor Login', `User completed two-factor login`);
    safeUpdateTag('activityFeed');

    return { success: true };
  }

  if (isRecoveryCode) {
    const codeHash = hashRecoveryCode(code);

    const { count } = await prisma.recoveryCode.updateMany({
      where: {
        user_id: userId,
        codeHash,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    if (count === 0) {
      void recordLoginAttempt(user.username, ipAddress, false);
      return { success: false, formErrors: ['Invalid recovery code'] };
    }

    await createSessionCookie(userId);

    void addEvent('Recovery Code Used', `User logged in with a recovery code`);
    safeUpdateTag('activityFeed');

    return { success: true };
  }

  void recordLoginAttempt(user.username, ipAddress, false);
  return { success: false, formErrors: ['Invalid code format'] };
}
