import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock unstable_cache to capture the keyParts it receives
const mockUnstableCache = vi.fn(
  (
    fn: () => Promise<string>,
    keyParts: string[] | undefined,
    _options?: object,
  ) => {
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
      // Tags + explicit keyParts + deployment ID
      expect.arrayContaining(['appSettings', 'custom-key', 'dpl_test123']),
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

  it('should include VERCEL_DEPLOYMENT_ID in keyParts when options is provided without keyParts', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', 'dpl_test789');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['appSettings'], { revalidate: 60 });

    const call = mockUnstableCache.mock.calls[0] as [
      () => Promise<string>,
      string[] | undefined,
      object,
    ];
    const keyParts = call[1];

    expect(keyParts).not.toBeUndefined();
    expect(keyParts).toContain('dpl_test789');
  });

  it('should use tags as default keyParts when VERCEL_DEPLOYMENT_ID is not set and no options provided', async () => {
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

    // Tags should be used as default keyParts to prevent cache collisions
    expect(keyParts).toEqual(['appSettings']);
  });

  it('should use tags as default keyParts and append VERCEL_DEPLOYMENT_ID when set', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', 'dpl_collision_test');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['getProtocols', 'summaryStatistics']);

    const call = mockUnstableCache.mock.calls[0] as [
      () => Promise<string>,
      string[] | undefined,
    ];
    const keyParts = call[1];

    // Should include all tags plus deployment ID
    expect(keyParts).toEqual([
      'getProtocols',
      'summaryStatistics',
      'dpl_collision_test',
    ]);
  });

  it('should combine tags with explicit keyParts when provided', async () => {
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', '');

    vi.resetModules();
    const { createCachedFunction } = await import('../cache');

    const testFn = () => Promise.resolve('result');
    createCachedFunction(testFn, ['appSettings'], {
      keyParts: ['custom-key'],
    });

    const call = mockUnstableCache.mock.calls[0] as [
      () => Promise<string>,
      string[] | undefined,
    ];
    const keyParts = call[1];

    // Tags should always be included, with explicit keyParts appended
    expect(keyParts).toEqual(['appSettings', 'custom-key']);
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
