import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<
    Record<string, unknown> & { cache?: unknown }
  >();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    after: vi.fn(),
  };
});

const {
  mockPrismaTotpCredentialFindFirst,
  mockPrismaUserFindUnique,
  mockPrismaRecoveryCodeUpdateMany,
  mockSafeUpdateTag,
  mockCheckRateLimit,
  mockRecordLoginAttempt,
  mockCreateSessionCookie,
  mockVerifyTwoFactorToken,
  mockVerifyTotpCode,
  mockHashRecoveryCode,
  mockGetClientIp,
  mockAddEvent,
  mockVerifyTwoFactorSchemaSafeParse,
  mockGetInstallationId,
} = vi.hoisted(() => ({
  mockPrismaTotpCredentialFindFirst: vi.fn(),
  mockPrismaUserFindUnique: vi.fn(),
  mockPrismaRecoveryCodeUpdateMany: vi.fn(),
  mockSafeUpdateTag: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockRecordLoginAttempt: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
  mockVerifyTwoFactorToken: vi.fn(),
  mockVerifyTotpCode: vi.fn(),
  mockHashRecoveryCode: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockAddEvent: vi.fn(),
  mockVerifyTwoFactorSchemaSafeParse: vi.fn(),
  mockGetInstallationId: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    user: {
      findUnique: mockPrismaUserFindUnique,
    },
    totpCredential: {
      findFirst: mockPrismaTotpCredentialFindFirst,
    },
    recoveryCode: {
      updateMany: mockPrismaRecoveryCodeUpdateMany,
    },
  },
}));

vi.mock('~/lib/cache', () => ({
  safeUpdateTag: mockSafeUpdateTag,
  safeRevalidateTag: vi.fn(),
  safeCacheTag: vi.fn(),
}));

vi.mock('~/lib/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
  recordLoginAttempt: mockRecordLoginAttempt,
}));

vi.mock('~/lib/session', () => ({
  createSessionCookie: mockCreateSessionCookie,
}));

vi.mock('~/lib/totp', () => ({
  verifyTwoFactorToken: mockVerifyTwoFactorToken,
  verifyTotpCode: mockVerifyTotpCode,
  hashRecoveryCode: mockHashRecoveryCode,
  createTwoFactorToken: vi.fn(),
  generateTotpSecret: vi.fn(),
  generateTotpUri: vi.fn(),
  generateQrCodeDataUrl: vi.fn(),
  generateRecoveryCodes: vi.fn(),
}));

vi.mock('~/utils/auth', () => ({
  requireApiAuth: vi.fn().mockResolvedValue(undefined),
  requirePageAuth: vi.fn().mockResolvedValue(undefined),
  getServerSession: vi.fn(),
}));

vi.mock('~/utils/getClientIp', () => ({
  getClientIp: mockGetClientIp,
}));

vi.mock('~/utils/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('~/actions/activityFeed', () => ({
  addEvent: mockAddEvent,
}));

vi.mock('~/queries/appSettings', () => ({
  getInstallationId: mockGetInstallationId,
}));

vi.mock('~/schemas/totp', () => ({
  verifyTwoFactorSchema: {
    safeParse: mockVerifyTwoFactorSchemaSafeParse,
  },
  verifyTotpSetupSchema: {
    safeParse: vi.fn(),
  },
  disableTotpSchema: {
    safeParse: vi.fn(),
  },
}));

import { verifyTwoFactor } from '../twoFactor';

const VALID_USER_ID = 'user-2fa-1';
const VALID_USERNAME = 'testuser2fa';
const VALID_IP = '192.168.1.1';
const VALID_TOTP_CODE = '123456';
const VALID_RECOVERY_CODE = 'a1b2c3d4e5f6a1b2c3d4';
const TOTP_SECRET = 'BASE32SECRET';

describe('verifyTwoFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIp.mockResolvedValue(VALID_IP);
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRecordLoginAttempt.mockResolvedValue(undefined);
    mockCreateSessionCookie.mockResolvedValue(undefined);
    mockGetInstallationId.mockResolvedValue('test-installation-id');
    mockPrismaUserFindUnique.mockResolvedValue({ username: VALID_USERNAME });
  });

  describe('schema validation', () => {
    it('returns error for invalid schema data', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: false,
        error: { issues: [] },
      });

      const result = await verifyTwoFactor({ twoFactorToken: '', code: '' });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Invalid submission');
      }
    });
  });

  describe('token verification', () => {
    it('returns error when two-factor token is expired or invalid', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'bad-token', code: VALID_TOTP_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({ valid: false });

      const result = await verifyTwoFactor({
        twoFactorToken: 'bad-token',
        code: VALID_TOTP_CODE,
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain(
          'Two-factor session expired. Please sign in again.',
        );
      }
    });
  });

  describe('rate limiting', () => {
    it('returns error when rate limited', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_TOTP_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 1700000000000,
      });

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_TOTP_CODE,
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain(
          'Too many attempts. Please sign in again.',
        );
      }
    });
  });

  describe('credential lookup', () => {
    it('returns error when no verified TOTP credential is found', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_TOTP_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue(null);

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_TOTP_CODE,
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain(
          'Two-factor authentication is not configured',
        );
      }
    });
  });

  describe('TOTP code verification', () => {
    it('returns success for a valid 6-digit TOTP code', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_TOTP_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockVerifyTotpCode.mockReturnValue(true);

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_TOTP_CODE,
      });

      expect(result.success).toBe(true);
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(VALID_USER_ID);
      expect(mockSafeUpdateTag).toHaveBeenCalledWith('activityFeed');
    });

    it('returns error for an invalid TOTP code', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: '000000' },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockVerifyTotpCode.mockReturnValue(false);

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: '000000',
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Invalid verification code');
      }
    });

    it('records a failed login attempt when TOTP code is invalid', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: '000000' },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockVerifyTotpCode.mockReturnValue(false);

      await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: '000000',
      });

      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        VALID_USERNAME,
        VALID_IP,
        false,
      );
    });
  });

  describe('recovery code verification', () => {
    it('returns success for a valid recovery code and marks it as used', async () => {
      const codeHash = 'sha256-hash-of-code';

      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_RECOVERY_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockHashRecoveryCode.mockReturnValue(codeHash);
      mockPrismaRecoveryCodeUpdateMany.mockResolvedValue({ count: 1 });

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_RECOVERY_CODE,
      });

      expect(result.success).toBe(true);
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(VALID_USER_ID);
      expect(mockPrismaRecoveryCodeUpdateMany).toHaveBeenCalledWith({
        where: {
          user_id: VALID_USER_ID,
          codeHash,
          usedAt: null,
        },
        data: { usedAt: expect.any(Date) as Date },
      });
      expect(mockSafeUpdateTag).toHaveBeenCalledWith('activityFeed');
    });

    it('returns error for an invalid or already-used recovery code', async () => {
      const codeHash = 'sha256-hash-of-bad-code';

      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_RECOVERY_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockHashRecoveryCode.mockReturnValue(codeHash);
      mockPrismaRecoveryCodeUpdateMany.mockResolvedValue({ count: 0 });

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_RECOVERY_CODE,
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Invalid recovery code');
      }
    });

    it('records a failed login attempt when recovery code is invalid', async () => {
      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: VALID_RECOVERY_CODE },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });
      mockHashRecoveryCode.mockReturnValue('some-hash');
      mockPrismaRecoveryCodeUpdateMany.mockResolvedValue({ count: 0 });

      await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: VALID_RECOVERY_CODE,
      });

      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        VALID_USERNAME,
        VALID_IP,
        false,
      );
    });
  });

  describe('unrecognized code format', () => {
    it('returns error and records a failed attempt for an unrecognized code format', async () => {
      const badCode = 'not-a-valid-format-xyz';

      mockVerifyTwoFactorSchemaSafeParse.mockReturnValue({
        success: true,
        data: { twoFactorToken: 'valid-token', code: badCode },
      });
      mockVerifyTwoFactorToken.mockReturnValue({
        valid: true,
        userId: VALID_USER_ID,
      });
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: VALID_USER_ID,
        secret: TOTP_SECRET,
        verified: true,
      });

      const result = await verifyTwoFactor({
        twoFactorToken: 'valid-token',
        code: badCode,
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Invalid code format');
      }
      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        VALID_USERNAME,
        VALID_IP,
        false,
      );
    });
  });
});
