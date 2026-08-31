import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import { InterviewRepository } from '@codaco/network-exporters/services/InterviewRepository';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';

vi.mock('server-only', () => ({}));

const { mockGetInterviewsForExport } = vi.hoisted(() => ({
  mockGetInterviewsForExport: vi.fn(),
}));

vi.mock('~/queries/interviews', () => ({
  getInterviewsForExport: mockGetInterviewsForExport,
}));

import { PrismaInterviewRepository } from '~/lib/export/InterviewRepository';

const network = {
  nodes: [],
  edges: [],
  ego: {
    [entityPrimaryKeyProperty]: 'ego-uid',
    [entityAttributesProperty]: {},
  },
};

const row = (
  participant: { identifier: string; label: string | null },
  networkValue: unknown = network,
) => ({
  id: 'interview-1',
  participant,
  startTime: new Date('2026-01-01'),
  finishTime: null,
  network: networkValue,
  protocol: { hash: 'protocol-hash' },
});

const getForExport = (ids: string[]) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* InterviewRepository;
      return yield* repository.getForExport(ids);
    }).pipe(Effect.provide(PrismaInterviewRepository)),
  );

describe('PrismaInterviewRepository', () => {
  it('exports the stable participant identifier, not the label', async () => {
    mockGetInterviewsForExport.mockResolvedValue([
      row({ identifier: 'P001', label: 'Alice' }),
    ]);

    const inputs = await getForExport(['interview-1']);

    expect(inputs[0]?.participantIdentifier).toBe('P001');
  });

  it('exports the identifier when the participant has no label', async () => {
    mockGetInterviewsForExport.mockResolvedValue([
      row({ identifier: 'P002', label: null }),
    ]);

    const inputs = await getForExport(['interview-1']);

    expect(inputs[0]?.participantIdentifier).toBe('P002');
  });

  it('normalizes legacy null attributes before export', async () => {
    mockGetInterviewsForExport.mockResolvedValue([
      row(
        { identifier: 'P003', label: null },
        {
          ...network,
          ego: {
            ...network.ego,
            attributes: { unanswered: null, answered: false },
          },
        },
      ),
    ]);

    const inputs = await getForExport(['interview-1']);

    expect(inputs[0]?.network.ego.attributes).toEqual({ answered: false });
  });

  it('throws invalid defined values into the existing export error path', async () => {
    mockGetInterviewsForExport.mockResolvedValue([
      row(
        { identifier: 'P004', label: null },
        {
          ...network,
          ego: {
            ...network.ego,
            attributes: { invalid: { nested: 'value' } },
          },
        },
      ),
    ]);

    await expect(getForExport(['interview-1'])).rejects.toThrow();
  });
});
