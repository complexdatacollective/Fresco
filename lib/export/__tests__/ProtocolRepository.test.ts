import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import { DatabaseError } from '@codaco/network-exporters/errors';
import { ProtocolRepository } from '@codaco/network-exporters/services/ProtocolRepository';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock('~/lib/db', () => ({
  prisma: { protocol: { findMany: mockFindMany } },
}));

import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';

const row = (codebook: unknown) => ({
  hash: 'protocol-hash',
  name: 'Study',
  codebook,
});

const getProtocols = Effect.gen(function* () {
  const repository = yield* ProtocolRepository;
  return yield* repository.getProtocols(['protocol-hash']);
}).pipe(Effect.provide(PrismaProtocolRepository));

describe('PrismaProtocolRepository', () => {
  it('exports the codebook it reads', async () => {
    const codebook = { node: {}, edge: {}, ego: { variables: {} } };
    mockFindMany.mockResolvedValue([row(codebook)]);

    const protocols = await Effect.runPromise(getProtocols);

    expect(protocols['protocol-hash']?.codebook).toEqual(codebook);
  });

  // An export run against an empty stand-in for the codebook would drop every
  // variable's name from the file. The batch route reports and closes the
  // stream only for a typed failure, so this must not be a thrown defect.
  it.each([
    ['a codebook that does not parse', { node: { person: 'not a type' } }],
    ['a missing codebook', null],
  ])('fails the export with a typed error for %s', async (_case, codebook) => {
    mockFindMany.mockResolvedValue([row(codebook)]);

    const error = await Effect.runPromise(Effect.flip(getProtocols));

    expect(error).toBeInstanceOf(DatabaseError);
  });
});
