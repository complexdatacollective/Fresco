import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
vi.mock('~/lib/cache', () => ({ safeCacheTag: vi.fn() }));

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('~/lib/db', () => ({ prisma: { protocol: { findMany } } }));

import { getInterviewFilterOptions } from '../interviews';

describe('getInterviewFilterOptions', () => {
  // The options only narrow the interviews list. A codebook that does not
  // parse offers no types of its own rather than failing the whole dashboard,
  // and never offers types read out of data that did not parse.
  it('offers the types of every codebook it can read, and none from one it cannot', async () => {
    findMany.mockResolvedValue([
      { name: 'Readable', codebook: { edge: { friend: { name: 'Friend' } } } },
      { name: 'Damaged', codebook: { edge: { rival: 'not an entity type' } } },
      { name: 'Missing', codebook: null },
    ]);

    const options = await getInterviewFilterOptions();

    expect(options.protocolNames).toEqual(['Damaged', 'Missing', 'Readable']);
    expect(options.edgeTypes).toEqual([{ value: 'friend', label: 'Friend' }]);
    expect(options.nodeTypes).toEqual([]);
  });
});
