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

  const tokenResult = verifyTwoFactorToken(twoFactorToken);
  if (!tokenResult.valid) {
    return {
      success: false,
      formErrors: ['Two-factor session expired. Please sign in again.'],
    };
  }

  const { userId } = tokenResult;

  const ipAddress = await getClientIp();
  const rateLimitResult = await checkRateLimit(userId, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      formErrors: ['Too many attempts. Please sign in again.'],
    };
  }

  const credential = await prisma.totpCredential.findUnique({
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
      void recordLoginAttempt(userId, ipAddress, false);
      return { success: false, formErrors: ['Invalid verification code'] };
    }

    await createSessionCookie(userId);

    void addEvent('Two-Factor Login', `User completed two-factor login`);
    safeUpdateTag('activityFeed');

    return { success: true };
  }

  if (isRecoveryCode) {
    const codeHash = hashRecoveryCode(code);

    const recoveryCode = await prisma.recoveryCode.findFirst({
      where: {
        user_id: userId,
        codeHash,
        usedAt: null,
      },
    });

    if (!recoveryCode) {
      void recordLoginAttempt(userId, ipAddress, false);
      return { success: false, formErrors: ['Invalid recovery code'] };
    }

    await prisma.recoveryCode.update({
      where: { id: recoveryCode.id },
      data: { usedAt: new Date() },
    });

    await createSessionCookie(userId);

    void addEvent('Recovery Code Used', `User logged in with a recovery code`);
    safeUpdateTag('activityFeed');

    return { success: true };
  }

  void recordLoginAttempt(userId, ipAddress, false);
  return { success: false, formErrors: ['Invalid code format'] };
}
