import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map([['origin', 'https://fresco.example.com']])),
}));

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('~/env', () => ({
  env: { NODE_ENV: 'test' },
}));

const {
  mockRequireApiAuth,
  mockKeyFindFirst,
  mockKeyUpdateMany,
  mockWebAuthnDeleteMany,
  mockTransaction,
  mockHashPassword,
} = vi.hoisted(() => ({
  mockRequireApiAuth: vi.fn(),
  mockKeyFindFirst: vi.fn(),
  mockKeyUpdateMany: vi.fn(),
  mockWebAuthnDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
  mockHashPassword: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    key: {
      findFirst: mockKeyFindFirst,
      updateMany: mockKeyUpdateMany,
      update: vi.fn(),
    },
    webAuthnCredential: {
      deleteMany: mockWebAuthnDeleteMany,
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    totpCredential: { deleteMany: vi.fn() },
    recoveryCode: { deleteMany: vi.fn() },
    user: { create: vi.fn(), findUnique: vi.fn() },
    $transaction: mockTransaction,
  },
}));

vi.mock('~/lib/auth/guards', () => ({
  requireApiAuth: mockRequireApiAuth,
}));

vi.mock('~/lib/auth/session', () => ({
  createSessionCookie: vi.fn(),
}));

vi.mock('~/lib/auth/webauthn', () => ({
  createChallengeCookie: vi.fn(),
  verifyChallengeCookie: vi.fn(),
  getWebAuthnConfig: vi.fn(),
}));

vi.mock('~/lib/cache', () => ({
  safeUpdateTag: vi.fn(),
  safeRevalidateTag: vi.fn(),
  safeCacheTag: vi.fn(),
}));

vi.mock('~/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
  recordLoginAttempt: vi.fn(),
}));

vi.mock('~/queries/appSettings', () => ({
  isAppConfigured: vi.fn(),
  getInstallationId: vi.fn(),
}));

vi.mock('~/utils/getClientIp', () => ({
  getClientIp: vi.fn(),
}));

vi.mock('~/utils/password', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: vi.fn(),
}));

vi.mock('~/actions/activityFeed', () => ({
  addEvent: vi.fn(),
}));

import { switchToPasswordMode } from '../webauthn';

describe('switchToPasswordMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiAuth.mockResolvedValue({
      user: { userId: 'user-1', username: 'researcher' },
    });
    // Passkey-only account: no password set.
    mockKeyFindFirst.mockResolvedValue({ id: 'key-1', hashed_password: null });
    mockHashPassword.mockResolvedValue('hashed');
    mockTransaction.mockResolvedValue([]);
  });

  it.each([
    ['an empty password', ''],
    ['a short password', 'Ab1!'],
    ['a password with no symbol', 'Password123'],
    ['a password with no uppercase', 'password123!'],
  ])('rejects %s without touching credentials', async (_label, password) => {
    const result = await switchToPasswordMode(password);

    expect(result.error).toContain('Password must be at least 8 characters');
    expect(result.data).toBeNull();
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('accepts a strong password', async () => {
    const result = await switchToPasswordMode('Sup3rSecret!');

    expect(result.error).toBeNull();
    expect(mockHashPassword).toHaveBeenCalledWith('Sup3rSecret!');
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('refuses when the account already has a password', async () => {
    mockKeyFindFirst.mockResolvedValue({
      id: 'key-1',
      hashed_password: 'existing',
    });

    const result = await switchToPasswordMode('Sup3rSecret!');

    expect(result.error).toBe('Account is already in password mode.');
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
