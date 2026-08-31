import { describe, expect, it } from 'vitest';

import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import type { GetInterviewByIdQuery } from '~/queries/interviews';

import { mapInterviewPayload } from '../mapInterviewPayload';

/**
 * A minimal interview row shaped exactly as `getInterviewById` returns it
 * (JSON columns already parsed by the Prisma result extension), parameterised
 * by the protocol's persisted schema version.
 */
function makeSource(schemaVersion: number): NonNullable<GetInterviewByIdQuery> {
  return {
    id: 'interview-1',
    startTime: new Date('2026-01-01T00:00:00.000Z'),
    finishTime: null,
    exportTime: null,
    lastUpdated: new Date('2026-01-02T00:00:00.000Z'),
    network: {
      nodes: [],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    },
    participantId: 'participant-1',
    protocolId: 'protocol-1',
    currentStep: 3,
    stageMetadata: null,
    isSynthetic: false,
    syncRevision: 7,
    protocol: {
      id: 'protocol-1',
      hash: 'abc123',
      name: 'Test Protocol',
      schemaVersion,
      description: null,
      importedAt: new Date('2026-01-01T00:00:00.000Z'),
      stages: [],
      codebook: { node: {}, edge: {} },
      experiments: {},
      originalFileKey: null,
      originalFileUrl: null,
      assets: [],
    },
  };
}

describe('mapInterviewPayload', () => {
  it('stamps the payload with the protocol row’s own schema version', () => {
    const { payload, initialStep } = mapInterviewPayload(
      makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
    );

    expect(payload.protocol.schemaVersion).toBe(
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
    );
    expect(payload.protocol.hash).toBe('abc123');
    expect(initialStep).toBe(3);
  });

  it('carries the row’s stored sync revision through, so writes are numbered from it', () => {
    // Numbering from zero instead would make every write a reloaded tab makes
    // older than what is stored, and the endpoint would discard all of them.
    const { initialSyncRevision } = mapInterviewPayload(
      makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
    );

    expect(initialSyncRevision).toBe(7);
  });

  it('refuses a protocol row stored below the compatible version rather than mislabelling it', () => {
    const staleVersion = COMPATIBLE_PROTOCOL_SCHEMA_VERSION - 1;

    expect(() => mapInterviewPayload(makeSource(staleVersion))).toThrow(
      new RegExp(
        `Test Protocol.+protocol-1.+${staleVersion}.+${COMPATIBLE_PROTOCOL_SCHEMA_VERSION}`,
        's',
      ),
    );
  });

  it('refuses a protocol row stored above the compatible version', () => {
    expect(() =>
      mapInterviewPayload(makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION + 1)),
    ).toThrow(/must be migrated/);
  });
});
