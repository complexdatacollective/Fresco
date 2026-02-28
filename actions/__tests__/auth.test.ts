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
  mockPrismaKeyFindUnique,
  mockPrismaTotpCredentialFindFirst,
  mockSafeUpdateTag,
  mockCheckRateLimit,
  mockRecordLoginAttempt,
  mockCreateSessionCookie,
  mockCreateTwoFactorToken,
  mockVerifyPassword,
  mockGetClientIp,
  mockAddEvent,
  mockLoginSchemaSafeParse,
  mockGetInstallationId,
} = vi.hoisted(() => ({
  mockPrismaKeyFindUnique: vi.fn(),
  mockPrismaTotpCredentialFindFirst: vi.fn(),
  mockSafeUpdateTag: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockRecordLoginAttempt: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
  mockCreateTwoFactorToken: vi.fn(),
  mockVerifyPassword: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockAddEvent: vi.fn(),
  mockLoginSchemaSafeParse: vi.fn(),
  mockGetInstallationId: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    key: {
      findUnique: mockPrismaKeyFindUnique,
    },
    totpCredential: {
      findFirst: mockPrismaTotpCredentialFindFirst,
    },
    session: {
      delete: vi.fn(),
    },
    user: {
      create: vi.fn(),
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
  createTwoFactorToken: mockCreateTwoFactorToken,
  verifyTwoFactorToken: vi.fn(),
  verifyTotpCode: vi.fn(),
  hashRecoveryCode: vi.fn(),
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
  verifyPassword: mockVerifyPassword,
}));

vi.mock('~/actions/activityFeed', () => ({
  addEvent: mockAddEvent,
}));

vi.mock('~/queries/appSettings', () => ({
  getInstallationId: mockGetInstallationId,
}));

vi.mock('~/schemas/auth', () => ({
  loginSchema: {
    safeParse: mockLoginSchemaSafeParse,
  },
  createUserFormDataSchema: {
    safeParse: vi.fn(),
  },
}));

import { login } from '../auth';

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIp.mockResolvedValue('127.0.0.1');
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRecordLoginAttempt.mockResolvedValue(undefined);
    mockCreateSessionCookie.mockResolvedValue(undefined);
    mockGetInstallationId.mockResolvedValue('test-installation-id');
  });

  describe('schema validation', () => {
    it('returns form errors when schema validation fails', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: false,
        error: {
          flatten: () => ({
            formErrors: [],
            fieldErrors: { username: ['Username cannot be empty'] },
          }),
          issues: [
            {
              path: ['username'],
              message: 'Username cannot be empty',
              code: 'too_small',
            },
          ],
        },
      });

      const result = await login({ username: '', password: 'secret' });

      expect(result.success).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('returns rateLimited with retryAfter when rate limit is exceeded', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'password123' },
      });
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 1700000000000,
      });

      const result = await login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect('rateLimited' in result && result.rateLimited).toBe(true);
      if (!result.success && 'rateLimited' in result) {
        expect(result.retryAfter).toBe(1700000000000);
      }
    });
  });

  describe('user lookup', () => {
    it('returns formErrors when user key is not found', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'unknownuser', password: 'password123' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue(null);

      const result = await login({
        username: 'unknownuser',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Incorrect username or password');
      }
    });

    it('returns formErrors when key has no hashed_password', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'password123' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:testuser',
        user_id: 'user-1',
        hashed_password: null,
      });

      const result = await login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Incorrect username or password');
      }
    });

    it('records a failed login attempt when user is not found', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'unknownuser', password: 'password123' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue(null);

      await login({ username: 'unknownuser', password: 'password123' });

      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        'unknownuser',
        '127.0.0.1',
        false,
      );
    });
  });

  describe('password verification', () => {
    it('returns formErrors when password is invalid', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'wrongpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:testuser',
        user_id: 'user-1',
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(false);

      const result = await login({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      if (!result.success && 'formErrors' in result) {
        expect(result.formErrors).toContain('Incorrect username or password');
      }
    });

    it('records a failed login attempt when password is invalid', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'wrongpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:testuser',
        user_id: 'user-1',
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(false);

      await login({ username: 'testuser', password: 'wrongpassword' });

      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        'testuser',
        '127.0.0.1',
        false,
      );
    });

    it('records a successful login attempt when password is correct', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'correctpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:testuser',
        user_id: 'user-1',
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockPrismaTotpCredentialFindFirst.mockResolvedValue(null);

      await login({ username: 'testuser', password: 'correctpassword' });

      expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
        'testuser',
        '127.0.0.1',
        true,
      );
    });
  });

  describe('two-factor authentication', () => {
    it('returns requiresTwoFactor when user has a verified TOTP credential', async () => {
      const userId = 'user-totp-1';
      const twoFactorToken = 'signed-token-abc123';

      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'totpuser', password: 'correctpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:totpuser',
        user_id: userId,
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockPrismaTotpCredentialFindFirst.mockResolvedValue({
        user_id: userId,
        secret: 'base32secret',
        verified: true,
      });
      mockCreateTwoFactorToken.mockReturnValue(twoFactorToken);

      const result = await login({
        username: 'totpuser',
        password: 'correctpassword',
      });

      expect(result.success).toBe(false);
      expect('requiresTwoFactor' in result && result.requiresTwoFactor).toBe(
        true,
      );
      if (!result.success && 'requiresTwoFactor' in result) {
        expect(result.twoFactorToken).toBe(twoFactorToken);
      }
      expect(mockCreateTwoFactorToken).toHaveBeenCalledWith(
        userId,
        'test-installation-id',
      );
    });
  });

  describe('successful login without 2FA', () => {
    it('creates a session cookie and returns success when credentials are valid and no TOTP is configured', async () => {
      const userId = 'user-no-totp';

      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'regularuser', password: 'correctpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:regularuser',
        user_id: userId,
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockPrismaTotpCredentialFindFirst.mockResolvedValue(null);

      const result = await login({
        username: 'regularuser',
        password: 'correctpassword',
      });

      expect(result.success).toBe(true);
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(userId);
    });

    it('invalidates the activityFeed cache tag on successful login', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'regularuser', password: 'correctpassword' },
      });
      mockPrismaKeyFindUnique.mockResolvedValue({
        id: 'username:regularuser',
        user_id: 'user-no-totp',
        hashed_password: '$argon2id$hashed',
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockPrismaTotpCredentialFindFirst.mockResolvedValue(null);

      await login({ username: 'regularuser', password: 'correctpassword' });

      expect(mockSafeUpdateTag).toHaveBeenCalledWith('activityFeed');
    });

    it('does not create a session when rate limited', async () => {
      mockLoginSchemaSafeParse.mockReturnValue({
        success: true,
        data: { username: 'testuser', password: 'password123' },
      });
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 1700000000000,
      });

      await login({ username: 'testuser', password: 'password123' });

      expect(mockCreateSessionCookie).not.toHaveBeenCalled();
    });
  });
});
