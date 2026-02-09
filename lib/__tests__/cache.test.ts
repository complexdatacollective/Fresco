import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock unstable_cache to capture the keyParts it receives
const mockUnstableCache = vi.fn(
  (fn: () => Promise<string>, keyParts: string[] | undefined) => {
    const wrapper = () => fn();
    return Object.assign(wrapper, { _keyParts: keyParts });
  },
);

vi.mock('next/cache', () => ({
  unstable_cache: mockUnstableCache,
  revalidateTag: vi.fn(),
}));

vi.mock('~/env', () => ({
  env: {
    DISABLE_NEXT_CACHE: false,
  },
}));

describe('createCachedFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('should include VERCEL_DEPLOYMENT_ID in keyParts when options.keyParts is provided', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', 'dpl_test123');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['appSettings'], { keyParts: ['custom-key'] });

    expect(mockUnstableCache).toHaveBeenCalledWith(
      testFn,
      expect.arrayContaining(['custom-key', 'dpl_test123']),
      expect.any(Object),
    );
  });

  it('should include VERCEL_DEPLOYMENT_ID in keyParts even when options is not provided', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', 'dpl_test456');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['appSettings']);

    const call = mockUnstableCache.mock.calls[0] as [
      () => Promise<string>,
      string[] | undefined,
    ];
    const keyParts = call[1];

    expect(keyParts).not.toBeUndefined();
    expect(keyParts).toContain('dpl_test456');
  });

  it('should pass empty array keyParts when VERCEL_DEPLOYMENT_ID is not set and no options provided', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', '');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['appSettings']);

    const call = mockUnstableCache.mock.calls[0] as [
      () => Promise<string>,
      string[] | undefined,
    ];
    const keyParts = call[1];

    expect(keyParts).toEqual([]);
  });

  it('should bypass cache entirely when DISABLE_NEXT_CACHE is true', async () => {
    vi.resetModules();
    vi.doMock('~/env', () => ({
      env: {
        DISABLE_NEXT_CACHE: true,
      },
    }));

    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    const result = createCachedFunction(testFn, ['appSettings']);

    expect(result).toBe(testFn);
    expect(mockUnstableCache).not.toHaveBeenCalled();
  });
});
