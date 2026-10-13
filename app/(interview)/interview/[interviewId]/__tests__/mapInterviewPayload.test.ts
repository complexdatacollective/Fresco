import { describe, expect, it } from 'vitest';

import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import type { GetInterviewByIdQuery } from '~/queries/interviews';

import { mapInterviewPayload } from '../mapInterviewPayload';

type Source = NonNullable<GetInterviewByIdQuery>;
type StoredProtocol = Partial<
  Pick<Source['protocol'], 'stages' | 'codebook' | 'experiments'>
>;

/**
 * A minimal interview row shaped exactly as `getInterviewById` returns it, with
 * every JSON column (the interview's and its protocol's) exactly as stored.
 */
function makeSource(
  schemaVersion: number,
  stored: Partial<Pick<Source, 'network' | 'stageMetadata'>> = {},
  storedProtocol: StoredProtocol = {},
): Source {
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
      ...storedProtocol,
    },
    ...stored,
  };
}

function mapReady(source: Source) {
  const result = mapInterviewPayload(source);
  if (!result.success) throw new Error('Expected a readable interview');
  return result;
}

describe('mapInterviewPayload', () => {
  it('stamps the payload with the protocol row’s own schema version', () => {
    const { payload, initialStep } = mapReady(
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
    const { initialSyncRevision } = mapReady(
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

  describe('stored participant data', () => {
    // Still holds the participant's answers, but no longer parses: a node
    // attribute holding a nested object.
    const unreadableNetwork = {
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { name: 'Ada', invalid: { nested: 'value' } },
        },
      ],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    };

    it('refuses to start from a stored network it cannot read, rather than from an empty one', () => {
      const result = mapInterviewPayload(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, {
          network: unreadableNetwork,
        }),
      );

      expect(result).toMatchObject({ success: false, unreadable: 'session' });
      expect(result).not.toHaveProperty('payload');
    });

    it('refuses to start from stored stage metadata it cannot read', () => {
      const result = mapInterviewPayload(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, {
          stageMetadata: { 'stage-1': 'not a list of answers' },
        }),
      );

      expect(result).toMatchObject({ success: false, unreadable: 'session' });
      expect(result).not.toHaveProperty('payload');
    });

    it('refuses a stored network that is missing altogether', () => {
      const result = mapInterviewPayload(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, { network: null }),
      );

      expect(result).toMatchObject({ success: false, unreadable: 'session' });
    });

    it('hands the client the stored network and stage metadata it read', () => {
      const network = {
        nodes: [
          { _uid: 'node-1', type: 'person', attributes: { name: 'Ada' } },
        ],
        edges: [],
        ego: { _uid: 'ego-1', attributes: { age: 42 } },
      };
      const stageMetadata = { 'stage-1': [[0, 'node-1', 'node-2', false]] };

      const { payload } = mapReady(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, {
          network,
          stageMetadata,
        }),
      );

      expect(payload.session.network).toEqual(network);
      expect(payload.session.stageMetadata).toEqual(stageMetadata);
    });

    it('starts without stage metadata when none is stored', () => {
      const { payload } = mapReady(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, { stageMetadata: null }),
      );

      expect(payload.session.stageMetadata).toBeUndefined();
    });
  });

  describe('stored protocol', () => {
    // Each of these still holds the researcher's design, but no longer parses.
    // An interview run against an empty stand-in for it would collect nothing,
    // and the participant could finish it believing they had taken part.
    it.each<[string, StoredProtocol]>([
      ['stages', { stages: [{ id: 'stage-1', type: 'NotAnInterface' }] }],
      ['codebook', { codebook: { node: { person: 'not an entity type' } } }],
      ['experiments', { experiments: { notAnExperiment: true } }],
    ])(
      'refuses to start from %s it cannot read, rather than from an empty stand-in',
      (_field, storedProtocol) => {
        const result = mapInterviewPayload(
          makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, {}, storedProtocol),
        );

        expect(result).toMatchObject({
          success: false,
          unreadable: 'protocol',
        });
        expect(result).not.toHaveProperty('payload');
      },
    );

    it('refuses a protocol whose stages are missing altogether', () => {
      const result = mapInterviewPayload(
        makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION, {}, { stages: null }),
      );

      expect(result).toMatchObject({ success: false, unreadable: 'protocol' });
    });

    it('hands the client the protocol it read', () => {
      const codebook = { node: {}, edge: {}, ego: { variables: {} } };
      const experiments = { encryptedVariables: true };

      const { payload } = mapReady(
        makeSource(
          COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
          {},
          { stages: [], codebook, experiments },
        ),
      );

      expect(payload.protocol.stages).toEqual([]);
      expect(payload.protocol.codebook).toEqual(codebook);
      expect(payload.protocol.experiments).toEqual(experiments);
    });

    it('reads a protocol that stores no experiments as having none enabled', () => {
      const { payload } = mapReady(
        makeSource(
          COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
          {},
          { experiments: null },
        ),
      );

      expect(payload.protocol.experiments).toEqual({});
    });
  });
});
