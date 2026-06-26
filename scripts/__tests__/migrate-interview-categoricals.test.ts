import { type Codebook } from '@codaco/protocol-validation';
import { type NcNetwork } from '@codaco/shared-consts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  migrateInterviewCategoricals,
  migrateNetworkCategoricals,
} from '~/scripts/migrate-interview-categoricals';

/**
 * A codebook with one categorical node variable, one ordinal node variable, one
 * categorical edge variable, and one categorical ego variable. The variable ids
 * double as the network attribute keys (the Network Canvas contract).
 */
const CAT_NODE = 'cat-node-var';
const ORD_NODE = 'ord-node-var';
const TEXT_NODE = 'text-node-var';
const CAT_EDGE = 'cat-edge-var';
const CAT_EGO = 'cat-ego-var';

function makeCodebook(): Codebook {
  return {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        shape: { default: 'circle' },
        variables: {
          [CAT_NODE]: {
            name: 'closeness',
            type: 'categorical',
            component: 'CheckboxGroup',
            options: [
              { label: 'Family', value: 'family' },
              { label: 'Friend', value: 'friend' },
            ],
          },
          [ORD_NODE]: {
            name: 'frequency',
            type: 'ordinal',
            component: 'LikertScale',
            options: [
              { label: 'Low', value: 1 },
              { label: 'High', value: 2 },
            ],
          },
          [TEXT_NODE]: {
            name: 'nickname',
            type: 'text',
            component: 'Text',
          },
        },
      },
    },
    edge: {
      friend: {
        name: 'Friend',
        color: 'edge-color-seq-1',
        variables: {
          [CAT_EDGE]: {
            name: 'context',
            type: 'categorical',
            component: 'ToggleButtonGroup',
            options: [
              { label: 'Work', value: 'work' },
              { label: 'School', value: 'school' },
            ],
          },
        },
      },
    },
    ego: {
      variables: {
        [CAT_EGO]: {
          name: 'identity',
          type: 'categorical',
          component: 'CheckboxGroup',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      },
    },
  };
}

function makeNetwork(overrides?: Partial<NcNetwork>): NcNetwork {
  return {
    nodes: [
      {
        _uid: 'node-1',
        type: 'person',
        attributes: {
          [CAT_NODE]: 'family',
          [ORD_NODE]: 1,
          [TEXT_NODE]: 'Bob',
        },
      },
    ],
    edges: [
      {
        _uid: 'edge-1',
        type: 'friend',
        from: 'node-1',
        to: 'node-1',
        attributes: { [CAT_EDGE]: 'work' },
      },
    ],
    ego: {
      _uid: 'ego-1',
      attributes: { [CAT_EGO]: 'a' },
    },
    ...overrides,
  };
}

describe('migrateNetworkCategoricals', () => {
  it('wraps scalar categorical values in single-element arrays', () => {
    const { network, changed } = migrateNetworkCategoricals(
      makeNetwork(),
      makeCodebook(),
    );

    expect(changed).toBe(true);
    expect(network.nodes[0]?.attributes[CAT_NODE]).toEqual(['family']);
    expect(network.edges[0]?.attributes[CAT_EDGE]).toEqual(['work']);
    expect(network.ego.attributes[CAT_EGO]).toEqual(['a']);
  });

  it('leaves ordinal, text, and number values untouched', () => {
    const { network } = migrateNetworkCategoricals(
      makeNetwork(),
      makeCodebook(),
    );

    expect(network.nodes[0]?.attributes[ORD_NODE]).toBe(1);
    expect(network.nodes[0]?.attributes[TEXT_NODE]).toBe('Bob');
  });

  it('wraps scalar number and boolean categorical values', () => {
    const network = makeNetwork({
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { [CAT_NODE]: 2 },
        },
      ],
    });

    const result = migrateNetworkCategoricals(network, makeCodebook());
    expect(result.changed).toBe(true);
    expect(result.network.nodes[0]?.attributes[CAT_NODE]).toEqual([2]);
  });

  it('is idempotent: already-array categorical values are unchanged', () => {
    const network = makeNetwork({
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { [CAT_NODE]: ['family'] },
        },
      ],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    });

    const result = migrateNetworkCategoricals(network, makeCodebook());
    expect(result.changed).toBe(false);
    expect(result.network.nodes[0]?.attributes[CAT_NODE]).toEqual(['family']);
  });

  it('leaves unanswered (null) categorical values untouched', () => {
    const network = makeNetwork({
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { [CAT_NODE]: null },
        },
      ],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    });

    const result = migrateNetworkCategoricals(network, makeCodebook());
    expect(result.changed).toBe(false);
    expect(result.network.nodes[0]?.attributes[CAT_NODE]).toBeNull();
  });

  it('reports no change when a network has no categorical scalars', () => {
    const network = makeNetwork({
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { [ORD_NODE]: 1, [TEXT_NODE]: 'Bob' },
        },
      ],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    });

    const result = migrateNetworkCategoricals(network, makeCodebook());
    expect(result.changed).toBe(false);
  });
});

type MockPrisma = {
  interview: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

function makeMockPrisma(): MockPrisma {
  return {
    interview: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

function makeRow(id: string, attributes: Record<string, unknown>) {
  return {
    id,
    protocolId: 'protocol-1',
    protocol: { codebook: makeCodebook() },
    network: {
      nodes: [{ _uid: 'node-1', type: 'person', attributes }],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    },
  };
}

describe('migrateInterviewCategoricals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a no-op when there are no interviews', async () => {
    const prisma = makeMockPrisma();

    await migrateInterviewCategoricals(
      prisma as unknown as Parameters<typeof migrateInterviewCategoricals>[0],
    );

    expect(prisma.interview.update).not.toHaveBeenCalled();
  });

  it('rewrites only interviews whose categorical values are scalars', async () => {
    const prisma = makeMockPrisma();
    prisma.interview.findMany.mockResolvedValueOnce([
      makeRow('needs-migration', { [CAT_NODE]: 'family' }),
      makeRow('already-array', { [CAT_NODE]: ['friend'] }),
    ]);

    await migrateInterviewCategoricals(
      prisma as unknown as Parameters<typeof migrateInterviewCategoricals>[0],
    );

    expect(prisma.interview.update).toHaveBeenCalledTimes(1);
    const call = prisma.interview.update.mock.calls[0]?.[0] as {
      where: { id: string };
      data: { network: NcNetwork };
    };
    expect(call.where).toEqual({ id: 'needs-migration' });
    expect(call.data.network.nodes[0]?.attributes[CAT_NODE]).toEqual([
      'family',
    ]);
  });

  it('skips an interview whose network fails to parse without aborting', async () => {
    const prisma = makeMockPrisma();
    prisma.interview.findMany.mockResolvedValueOnce([
      { ...makeRow('broken', {}), network: 'not-a-network' },
      makeRow('valid', { [CAT_NODE]: 'family' }),
    ]);

    await migrateInterviewCategoricals(
      prisma as unknown as Parameters<typeof migrateInterviewCategoricals>[0],
    );

    expect(prisma.interview.update).toHaveBeenCalledTimes(1);
    const call = prisma.interview.update.mock.calls[0]?.[0] as {
      where: { id: string };
    };
    expect(call.where).toEqual({ id: 'valid' });
  });

  it('pages through interviews until a short batch is returned', async () => {
    const prisma = makeMockPrisma();
    const fullBatch = Array.from({ length: 200 }, (_, i) =>
      makeRow(`id-${String(i).padStart(3, '0')}`, { [CAT_NODE]: ['friend'] }),
    );
    prisma.interview.findMany
      .mockResolvedValueOnce(fullBatch)
      .mockResolvedValueOnce([makeRow('last', { [CAT_NODE]: ['friend'] })]);

    await migrateInterviewCategoricals(
      prisma as unknown as Parameters<typeof migrateInterviewCategoricals>[0],
    );

    expect(prisma.interview.findMany).toHaveBeenCalledTimes(2);
    const secondCall = prisma.interview.findMany.mock.calls[1]?.[0] as {
      cursor?: { id: string };
      skip?: number;
    };
    expect(secondCall.cursor).toEqual({ id: 'id-199' });
    expect(secondCall.skip).toBe(1);
  });
});
