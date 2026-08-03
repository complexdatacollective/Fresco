import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockCount, mockFindFirst, mockCreate, mockDeleteMany } = vi.hoisted(
  () => ({
    mockCount: vi.fn(),
    mockFindFirst: vi.fn(),
    mockCreate: vi.fn(),
    mockDeleteMany: vi.fn(),
  }),
);

vi.mock('~/lib/db', () => ({
  prisma: {
    loginAttempt: {
      count: mockCount,
      findFirst: mockFindFirst,
      create: mockCreate,
      deleteMany: mockDeleteMany,
    },
  },
}));

import {
  checkRateLimit,
  cleanupOldAttempts,
  recordLoginAttempt,
} from '~/lib/rateLimit';

const WINDOW_MS = 15 * 60 * 1000;
const CLEANUP_AGE_MS = 60 * 60 * 1000;

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns allowed when there are no failures (0 failures)', async () => {
    mockCount.mockResolvedValue(0);

    const result = await checkRateLimit('testuser', '127.0.0.1');

    expect(result).toEqual({ allowed: true });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns allowed when there is exactly 1 failure (within FREE_FAILURES limit)', async () => {
    mockCount.mockResolvedValue(1);

    const result = await checkRateLimit('testuser', '127.0.0.1');

    expect(result).toEqual({ allowed: true });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns not allowed with retryAfter when 2 failures and delay not yet expired', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', '127.0.0.1');

    // 2 failures → delay = 1000 * 2^(2-2) = 1000ms
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 1000,
    });
  });

  it('returns not allowed with retryAfter when 3 failures and delay not yet expired', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(3);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', '127.0.0.1');

    // 3 failures → delay = 1000 * 2^(3-2) = 2000ms
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 2000,
    });
  });

  it('returns not allowed with retryAfter when 4 failures and delay not yet expired', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(4);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', '127.0.0.1');

    // 4 failures → delay = 1000 * 2^(4-2) = 4000ms
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 4000,
    });
  });

  it('returns allowed when delay has expired', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    // Last attempt was 2000ms ago with 2 failures (delay is 1000ms) — fully expired
    const lastAttemptTime = now - 2000;
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', '127.0.0.1');

    expect(result).toEqual({ allowed: true });
  });

  it('uses the worst of username and IP failure counts', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    // Return 1 for username, 3 for IP — worst is 3 → delay 2000ms
    mockCount
      .mockResolvedValueOnce(1) // username
      .mockResolvedValueOnce(3); // ipAddress
    // Per-dimension last attempt queries: username then IP
    mockFindFirst
      .mockResolvedValueOnce({ timestamp: new Date(lastAttemptTime) }) // username
      .mockResolvedValueOnce({ timestamp: new Date(lastAttemptTime) }); // ipAddress

    const result = await checkRateLimit('testuser', '127.0.0.1');

    // IP has 3 failures → delay 2000ms, which is worse than username's 1 failure (0ms)
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 2000,
    });
  });

  it('works with null username (IP-only check)', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit(null, '127.0.0.1');

    // count should only be called once (for IP, not username)
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockCount.mock.calls[0]?.[0]).toHaveProperty(
      'where.ipAddress',
      '127.0.0.1',
    );
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 1000,
    });
  });

  it('works with null ipAddress (username-only check)', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', null);

    // count should only be called once (for username, not IP)
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockCount.mock.calls[0]?.[0]).toHaveProperty(
      'where.username',
      'testuser',
    );
    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 1000,
    });
  });

  it('returns allowed when both username and ipAddress are null', async () => {
    const result = await checkRateLimit(null, null);

    expect(mockCount).not.toHaveBeenCalled();
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(result).toEqual({ allowed: true });
  });

  it('returns allowed when delay is non-zero but findFirst returns null', async () => {
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue(null);

    const result = await checkRateLimit('testuser', '127.0.0.1');

    expect(result).toEqual({ allowed: true });
  });

  it('caps delay at 30000ms for a very large number of failures', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    // With 20 failures: 1000 * 2^18 >> 30000ms, so it should be capped at 30000
    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(20);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    const result = await checkRateLimit('testuser', '127.0.0.1');

    expect(result).toEqual({
      allowed: false,
      retryAfter: lastAttemptTime + 30_000,
    });
  });

  it('queries count using the 15-minute window', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    mockCount.mockResolvedValue(0);

    await checkRateLimit('testuser', '127.0.0.1');

    const expectedWindowStart = new Date(now - WINDOW_MS);
    expect(mockCount.mock.calls[0]?.[0]).toHaveProperty('where.timestamp', {
      gte: expectedWindowStart,
    });
  });

  it('queries per-dimension findFirst using the 15-minute window and orders by timestamp desc', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    const lastAttemptTime = now - 500;
    mockCount.mockResolvedValue(2);
    mockFindFirst.mockResolvedValue({
      timestamp: new Date(lastAttemptTime),
    });

    await checkRateLimit('testuser', '127.0.0.1');

    const expectedWindowStart = new Date(now - WINDOW_MS);
    // Two separate findFirst calls: one for username, one for IP
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
    expect(mockFindFirst.mock.calls[0]?.[0]).toHaveProperty(
      'where.username',
      'testuser',
    );
    expect(mockFindFirst.mock.calls[0]?.[0]).toHaveProperty('where.timestamp', {
      gte: expectedWindowStart,
    });
    expect(mockFindFirst.mock.calls[0]?.[0]).toHaveProperty('orderBy', {
      timestamp: 'desc',
    });
    expect(mockFindFirst.mock.calls[0]?.[0]).toHaveProperty('select', {
      timestamp: true,
    });
    expect(mockFindFirst.mock.calls[1]?.[0]).toHaveProperty(
      'where.ipAddress',
      '127.0.0.1',
    );
  });
});

describe('recordLoginAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockDeleteMany.mockResolvedValue({ count: 0 });
  });

  it('creates a login attempt record with the provided data', async () => {
    await recordLoginAttempt('testuser', '127.0.0.1', false);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        username: 'testuser',
        ipAddress: '127.0.0.1',
        success: false,
      },
    });
  });

  it('creates a successful login attempt record', async () => {
    await recordLoginAttempt('testuser', '127.0.0.1', true);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        username: 'testuser',
        ipAddress: '127.0.0.1',
        success: true,
      },
    });
  });

  it('creates a record with null username', async () => {
    await recordLoginAttempt(null, '127.0.0.1', false);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        username: null,
        ipAddress: '127.0.0.1',
        success: false,
      },
    });
  });

  it('creates a record with null ipAddress', async () => {
    await recordLoginAttempt('testuser', null, false);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        username: 'testuser',
        ipAddress: null,
        success: false,
      },
    });
  });

  it('calls cleanupOldAttempts probabilistically after creating the record', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    await recordLoginAttempt('testuser', '127.0.0.1', false);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockDeleteMany).toHaveBeenCalledTimes(1);

    randomSpy.mockRestore();
  });

  it('skips cleanup when random value exceeds threshold', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    await recordLoginAttempt('testuser', '127.0.0.1', false);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockDeleteMany).not.toHaveBeenCalled();

    randomSpy.mockRestore();
  });

  it('calls cleanup after create, not before', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const callOrder: string[] = [];
    mockCreate.mockImplementation(() => {
      callOrder.push('create');
      return Promise.resolve(undefined);
    });
    mockDeleteMany.mockImplementation(() => {
      callOrder.push('deleteMany');
      return Promise.resolve({ count: 0 });
    });

    await recordLoginAttempt('testuser', '127.0.0.1', false);

    expect(callOrder).toEqual(['create', 'deleteMany']);

    randomSpy.mockRestore();
  });
});

describe('cleanupOldAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deletes records older than 1 hour', async () => {
    const now = 1_000_000;
    vi.setSystemTime(now);

    await cleanupOldAttempts();

    const expectedCutoff = new Date(now - CLEANUP_AGE_MS);
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        timestamp: { lt: expectedCutoff },
      },
    });
  });

  it('calls deleteMany exactly once', async () => {
    await cleanupOldAttempts();

    expect(mockDeleteMany).toHaveBeenCalledTimes(1);
  });
});
