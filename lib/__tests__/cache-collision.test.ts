/**
 * Tests to verify that cached query functions exercised by this suite produce
 * unique cache keys.
 *
 * This helps prevent cache key collisions where different functions return
 * each other's data due to minification making function bodies identical.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Track all calls to unstable_cache with their keyParts
const capturedCacheCalls: {
  keyParts: string[] | undefined;
  tags: string[] | undefined;
  functionName: string;
}[] = [];

// Mock unstable_cache to capture keyParts from all cached functions
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn(
    (
      fn: () => Promise<unknown>,
      keyParts: string[] | undefined,
      options?: { tags?: string[] },
    ) => {
      capturedCacheCalls.push({
        keyParts,
        tags: options?.tags,
        // Try to extract a meaningful name from the function
        functionName: fn.name || fn.toString().slice(0, 50),
      });
      return fn;
    },
  ),
  revalidateTag: vi.fn(),
}));

// Mock environment
vi.mock('~/env', () => ({
  env: {
    DISABLE_NEXT_CACHE: false,
  },
}));

// Mock Prisma client to prevent actual DB calls
vi.mock('~/lib/db', () => ({
  prisma: {
    apiToken: { findMany: vi.fn().mockResolvedValue([]) },
    protocol: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    participant: { findMany: vi.fn().mockResolvedValue([]) },
    interview: { count: vi.fn().mockResolvedValue(0) },
    $transaction: vi.fn().mockResolvedValue([0, 0, 0]),
  },
}));

// Mock server-only (it throws if imported in non-server context)
vi.mock('server-only', () => ({}));

describe('Cache Key Collision Prevention', () => {
  beforeAll(async () => {
    // Clear any previous calls
    capturedCacheCalls.length = 0;

    // Import all query modules that use createCachedFunction
    // This triggers the cached function creation at module load time
    await import('~/queries/apiTokens');
    await import('~/queries/protocols');
    await import('~/queries/participants');
    await import('~/queries/summaryStatistics');
  });

  it('should have captured multiple cached function registrations', () => {
    // Sanity check: we should have captured calls from the imports
    expect(capturedCacheCalls.length).toBeGreaterThan(0);
  });

  it('all cached functions should have unique keyParts', () => {
    // Group functions by their keyParts
    const keyPartsToFunctions = new Map<string, string[]>();

    for (const call of capturedCacheCalls) {
      const keyPartsString = call.keyParts?.join(',') ?? '(empty)';
      const funcName = call.tags?.join(',') ?? call.functionName;

      if (!keyPartsToFunctions.has(keyPartsString)) {
        keyPartsToFunctions.set(keyPartsString, []);
      }
      keyPartsToFunctions.get(keyPartsString)!.push(funcName);
    }

    // Find collisions (keyParts with multiple functions)
    const collisions: { keyParts: string; functions: string[] }[] = [];

    for (const [keyParts, functions] of keyPartsToFunctions) {
      if (functions.length > 1) {
        collisions.push({ keyParts, functions });
      }
    }

    // Log collisions for visibility
    if (collisions.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n🔴 CACHE KEY COLLISIONS DETECTED:');
      for (const collision of collisions) {
        // eslint-disable-next-line no-console
        console.log(`  keyParts: "${collision.keyParts}"`);
        // eslint-disable-next-line no-console
        console.log(`  functions sharing this key:`);
        for (const func of collision.functions) {
          // eslint-disable-next-line no-console
          console.log(`    - ${func}`);
        }
      }
    }

    expect(collisions).toEqual([]);
  });

  it('getApiTokens and getProtocols should have different keyParts', () => {
    const apiTokensCall = capturedCacheCalls.find((call) =>
      call.tags?.includes('getApiTokens'),
    );
    const protocolsCall = capturedCacheCalls.find(
      (call) =>
        call.tags?.includes('getProtocols') &&
        !call.tags?.includes('getProtocolsByHash'),
    );

    expect(apiTokensCall).toBeDefined();
    expect(protocolsCall).toBeDefined();

    const apiTokensKey = apiTokensCall?.keyParts?.join(',');
    const protocolsKey = protocolsCall?.keyParts?.join(',');

    expect(apiTokensKey).not.toEqual(protocolsKey);
  });

  it('no cached function should have empty keyParts', () => {
    const emptyKeyPartsCalls = capturedCacheCalls.filter(
      (call) => !call.keyParts || call.keyParts.length === 0,
    );

    expect(emptyKeyPartsCalls).toEqual([]);
  });

  it('each cached function keyParts should contain at least one tag', () => {
    for (const call of capturedCacheCalls) {
      const keyParts = call.keyParts ?? [];
      const tags = call.tags ?? [];

      // At least one tag should be in keyParts (our fix ensures tags are used as default keyParts)
      const hasTagInKeyParts = tags.some((tag) => keyParts.includes(tag));

      expect(hasTagInKeyParts).toBe(true);
    }
  });
});
