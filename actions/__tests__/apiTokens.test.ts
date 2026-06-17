import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    apiToken: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      create: vi.fn(),
    },
  },
}));
vi.mock('~/lib/auth/guards', () => ({ requireApiAuth: vi.fn() }));
vi.mock('~/lib/cache', () => ({ safeUpdateTag: vi.fn() }));
vi.mock('~/actions/activityFeed', () => ({ addEvent: vi.fn() }));
vi.mock('~/schemas/apiTokens', () => ({
  createApiTokenSchema: { parse: vi.fn() },
  updateApiTokenSchema: { parse: vi.fn() },
  deleteApiTokenSchema: { parse: vi.fn() },
}));

import { verifyApiToken } from '../apiTokens';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('verifyApiToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('looks up the SHA-256 hash of the presented token, never the plaintext', async () => {
    mockFindUnique.mockResolvedValue({ id: 't1' });
    mockUpdate.mockResolvedValue({});

    const result = await verifyApiToken('plaintext-token');

    expect(result).toEqual({ valid: true });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { token: sha256('plaintext-token'), isActive: true },
    });
    // Sanity: the stored lookup key is a hash, not the raw bearer token.
    expect(sha256('plaintext-token')).not.toBe('plaintext-token');
  });

  it('returns invalid when no matching token hash exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await verifyApiToken('does-not-exist');

    expect(result).toEqual({ valid: false });
  });
});
