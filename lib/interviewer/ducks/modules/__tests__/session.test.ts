import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addNode,
  createInitialNetwork,
  updateEgo,
} from '~/lib/interviewer/ducks/modules/session';

/**
 * Minimal store setup for testing session thunks.
 * Only includes state required by addNode.
 */
function createTestStore(options: {
  codebookVariables?: Record<string, { name: string }>;
  nodeTypeName?: string;
}) {
  const nodeTypeId = 'test-node-type-uuid';
  const { codebookVariables = {}, nodeTypeName = 'Person' } = options;

  return configureStore({
    reducer: {
      session: (state = createTestSessionState()) => state,
      protocol: (state = createTestProtocolState()) => state,
      ui: (state = { passphrase: null }) => state,
    },
    preloadedState: {
      session: createTestSessionState(),
      protocol: createTestProtocolState(
        nodeTypeId,
        nodeTypeName,
        codebookVariables,
      ),
      ui: { passphrase: null },
    },
  });

  function createTestSessionState() {
    return {
      id: 'test-session',
      startTime: new Date().toISOString(),
      finishTime: null,
      exportTime: null,
      lastUpdated: new Date().toISOString(),
      network: createInitialNetwork(),
      currentStep: 0,
      promptIndex: 0,
    };
  }

  function createTestProtocolState(
    typeId = nodeTypeId,
    typeName = nodeTypeName,
    variables: Record<string, { name: string }> = {},
  ) {
    return {
      codebook: {
        node: {
          [typeId]: {
            name: typeName,
            variables,
          },
        },
      },
      stages: [{ id: 'stage-1' }],
    };
  }
}

describe('addNode', () => {
  describe('attribute validation', () => {
    it('succeeds with valid codebook attributes', async () => {
      // Setup
      const store = createTestStore({
        codebookVariables: {
          'var-uuid-1': { name: 'firstName' },
          'var-uuid-2': { name: 'lastName' },
        },
      });

      // Execute
      const result = await store.dispatch(
        addNode({
          type: 'test-node-type-uuid',
          attributeData: {
            'var-uuid-1': 'John',
            'var-uuid-2': 'Doe',
          },
        }),
      );

      // Verify
      expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
      expect(result.payload).toMatchObject({
        type: 'test-node-type-uuid',
        attributeData: expect.objectContaining({
          'var-uuid-1': 'John',
          'var-uuid-2': 'Doe',
        }),
      });
    });

    it('succeeds with empty attributeData', async () => {
      // Setup
      const store = createTestStore({
        codebookVariables: {
          'var-uuid-1': { name: 'firstName' },
        },
      });

      // Execute
      const result = await store.dispatch(
        addNode({
          type: 'test-node-type-uuid',
          attributeData: {},
        }),
      );

      // Verify
      expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
    });

    it('succeeds with undefined attributeData', async () => {
      // Setup
      const store = createTestStore({
        codebookVariables: {},
      });

      // Execute
      const result = await store.dispatch(
        addNode({
          type: 'test-node-type-uuid',
        }),
      );

      // Verify
      expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
    });

    describe('unknown attributes (external data scenario)', () => {
      /**
       * This is the core scenario: external roster data contains attributes
       * that don't have corresponding codebook variables.
       * These pass through makeVariableUUIDReplacer with their original keys.
       */

      it('rejects unknown attributes by default', async () => {
        // Setup
        const store = createTestStore({
          codebookVariables: {
            'var-uuid-1': { name: 'firstName' },
          },
        });

        // Execute
        const result = await store.dispatch(
          addNode({
            type: 'test-node-type-uuid',
            attributeData: {
              'var-uuid-1': 'John',
              unknownKey: 'value',
            },
          }),
        );

        // Verify
        expect(result.type).toBe('NETWORK/ADD_NODE/rejected');
        expect(
          (result as { error: { message: string } }).error.message,
        ).toContain('unknownKey');
        expect(
          (result as { error: { message: string } }).error.message,
        ).toContain('do not exist in protocol codebook');
      });

      it('allows unknown attributes when allowUnknownAttributes: true', async () => {
        // Setup
        const store = createTestStore({
          codebookVariables: {
            'var-uuid-1': { name: 'firstName' },
          },
        });

        // Execute - simulates external data with attributes not in codebook
        const result = await store.dispatch(
          addNode({
            type: 'test-node-type-uuid',
            attributeData: {
              'var-uuid-1': 'John', // Known attribute
              name: 'John Doe', // Unknown - from CSV column
              first_language: 'English', // Unknown - from CSV column
            },
            allowUnknownAttributes: true,
          }),
        );

        // Verify
        expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
        expect(
          (result.payload as { attributeData: Record<string, unknown> })
            .attributeData,
        ).toMatchObject({
          'var-uuid-1': 'John',
          name: 'John Doe',
          first_language: 'English',
        });
      });

      it('preserves all attributes when allowUnknownAttributes is true', async () => {
        // Setup
        const store = createTestStore({
          codebookVariables: {
            'var-uuid-1': { name: 'firstName' },
          },
        });

        // Execute
        const result = await store.dispatch(
          addNode({
            type: 'test-node-type-uuid',
            attributeData: {
              'var-uuid-1': 'John',
              externalField: 'external value',
              anotherField: 123,
            },
            allowUnknownAttributes: true,
          }),
        );

        // Verify
        expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
        const payload = result.payload as {
          attributeData: Record<string, unknown>;
        };
        expect(payload.attributeData['var-uuid-1']).toBe('John');
        expect(payload.attributeData['externalField']).toBe('external value');
        expect(payload.attributeData['anotherField']).toBe(123);
      });
    });
  });

  describe('default attributes', () => {
    it('includes all codebook variables even when only some are provided', async () => {
      // Setup: codebook has 3 node variables
      const store = createTestStore({
        codebookVariables: {
          'var-uuid-1': { name: 'firstName' },
          'var-uuid-2': { name: 'lastName' },
          'var-uuid-3': { name: 'age' },
        },
      });

      // Execute: only provide value for one variable
      const result = await store.dispatch(
        addNode({
          type: 'test-node-type-uuid',
          attributeData: {
            'var-uuid-1': 'John',
          },
        }),
      );

      // Verify: all variables should be in the payload, missing ones as null
      expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
      const payload = result.payload as { attributeData: Record<string, unknown> };
      expect(payload.attributeData).toEqual({
        'var-uuid-1': 'John',
        'var-uuid-2': null,
        'var-uuid-3': null,
      });
    });
  });
});

/**
 * Creates a test store with ego variables configured in the codebook.
 */
function createTestStoreWithEgo(options: {
  egoVariables?: Record<string, { name: string }>;
}) {
  const { egoVariables = {} } = options;

  const sessionState = createTestSessionState();
  const protocolState = createTestProtocolState(egoVariables);
  const uiState = { passphrase: null };

  type SessionState = ReturnType<typeof createTestSessionState>;
  type ProtocolState = ReturnType<typeof createTestProtocolState>;
  type UIState = typeof uiState;

  return configureStore({
    reducer: {
      session: (state: SessionState = sessionState): SessionState => state,
      protocol: (state: ProtocolState = protocolState): ProtocolState => state,
      ui: (state: UIState = uiState): UIState => state,
    },
    preloadedState: {
      session: sessionState,
      protocol: protocolState,
      ui: uiState,
    },
  });

  function createTestSessionState() {
    return {
      id: 'test-session',
      startTime: new Date().toISOString(),
      finishTime: null,
      exportTime: null,
      lastUpdated: new Date().toISOString(),
      network: createInitialNetwork(),
      currentStep: 0,
      promptIndex: 0,
    };
  }

  function createTestProtocolState(
    egoVars: Record<string, { name: string }> = {},
  ) {
    return {
      codebook: {
        ego: {
          variables: egoVars,
        },
        node: {},
      },
      stages: [{ id: 'stage-1' }],
    };
  }
}

/**
 * Creates a test store with edge types configured in the codebook.
 */
function createTestStoreWithEdge(options: {
  edgeVariables?: Record<string, { name: string }>;
}) {
  const edgeTypeId = 'test-edge-type-uuid';
  const { edgeVariables = {} } = options;

  const network = createInitialNetwork();
  // Add two nodes so we can create edges between them
  network.nodes = [
    { _uid: 'node-1', type: 'person', attributes: {} },
    { _uid: 'node-2', type: 'person', attributes: {} },
  ];

  const sessionState = createTestSessionState();
  const protocolState = createTestProtocolState(edgeTypeId, edgeVariables);
  const uiState = { passphrase: null };

  type SessionState = ReturnType<typeof createTestSessionState>;
  type ProtocolState = ReturnType<typeof createTestProtocolState>;
  type UIState = typeof uiState;

  return configureStore({
    reducer: {
      session: (state: SessionState = sessionState): SessionState => state,
      protocol: (state: ProtocolState = protocolState): ProtocolState => state,
      ui: (state: UIState = uiState): UIState => state,
    },
    preloadedState: {
      session: sessionState,
      protocol: protocolState,
      ui: uiState,
    },
  });

  function createTestSessionState() {
    return {
      id: 'test-session',
      startTime: new Date().toISOString(),
      finishTime: null,
      exportTime: null,
      lastUpdated: new Date().toISOString(),
      network,
      currentStep: 0,
      promptIndex: 0,
    };
  }

  function createTestProtocolState(
    typeId: string,
    variables: Record<string, { name: string }> = {},
  ) {
    return {
      codebook: {
        edge: {
          [typeId]: {
            name: 'friendship',
            variables,
          },
        },
        node: {},
      },
      stages: [{ id: 'stage-1' }],
    };
  }
}

describe('addEdge', () => {
  describe('default attributes', () => {
    it('includes all codebook variables even when only some are provided', async () => {
      // Setup: codebook has 3 edge variables
      const store = createTestStoreWithEdge({
        edgeVariables: {
          'edge-var-1': { name: 'strength' },
          'edge-var-2': { name: 'duration' },
          'edge-var-3': { name: 'frequency' },
        },
      });

      // Execute: only provide value for one variable
      const result = await store.dispatch(
        addEdge({
          type: 'test-edge-type-uuid',
          from: 'node-1',
          to: 'node-2',
          attributeData: {
            'edge-var-1': 5,
          },
        }),
      );

      // Verify: all variables should be in the payload, missing ones as null
      expect(result.type).toBe('NETWORK/ADD_EDGE/fulfilled');
      const payload = result.payload as { attributeData: Record<string, unknown> };
      expect(payload.attributeData).toEqual({
        'edge-var-1': 5,
        'edge-var-2': null,
        'edge-var-3': null,
      });
    });
  });
});

describe('updateEgo', () => {
  describe('default attributes', () => {
    it('includes all codebook variables even when only some are provided', async () => {
      // Setup: codebook has 3 ego variables
      const store = createTestStoreWithEgo({
        egoVariables: {
          'ego-var-1': { name: 'age' },
          'ego-var-2': { name: 'gender' },
          'ego-var-3': { name: 'occupation' },
        },
      });

      // Execute: only provide value for one variable
      const result = await store.dispatch(
        updateEgo({
          'ego-var-1': 25,
        }),
      );

      // Verify: all variables should be in the payload, missing ones as null
      expect(result.type).toBe('NETWORK/UPDATE_EGO/fulfilled');
      expect(result.payload).toEqual({
        'ego-var-1': 25,
        'ego-var-2': null,
        'ego-var-3': null,
      });
    });
  });
});
