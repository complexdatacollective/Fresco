import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import {
  addNode,
  createInitialNetwork,
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
    it('merges default attributes from codebook', async () => {
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
          },
        }),
      );

      // Verify
      expect(result.type).toBe('NETWORK/ADD_NODE/fulfilled');
    });
  });
});
