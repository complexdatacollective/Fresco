import { type Stage, stageSchema } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { generateNetwork } from './generateNetwork';

type Codebook = Parameters<typeof generateNetwork>[0];

type ZodLiteralDef = { _zod: { def: { values: string[] } } };
type ZodOptionShape = { shape: { type: ZodLiteralDef } };

/**
 * Extract all stage type literals from the protocol validation schema
 * at runtime, so this test automatically breaks when new stage types
 * are added to the schema but not handled by generateNetwork.
 */
function getAllStageTypes(): string[] {
  const options = (stageSchema as unknown as { options: ZodOptionShape[] })
    .options;
  return options.map((s) => {
    const value = s.shape.type._zod.def.values[0];
    if (!value) throw new Error('Could not extract stage type from schema');
    return value;
  });
}

function makeCodebook(overrides?: Partial<Codebook>): Codebook {
  return {
    node: {
      'node-type-1': {
        color: 'node-color-seq-1',
        variables: {
          'var-name': { name: 'Name', type: 'text' },
        },
      },
    },
    edge: {
      'edge-type-1': {
        color: 'edge-color-seq-1',
        variables: {},
      },
    },
    ...overrides,
  };
}

function makeFamilyPedigreeStage(overrides?: Record<string, unknown>): Stage {
  return {
    id: 'stage-fp',
    label: 'Family',
    type: 'FamilyPedigree',
    nodeConfig: {
      type: 'node-type-1',
      nodeLabelVariable: 'var-name',
      egoVariable: 'var-ego',
      biologicalSexVariable: 'var-sex',
      relationshipVariable: 'var-rel',
    },
    edgeConfig: {
      type: 'edge-type-1',
      relationshipTypeVariable: 'var-rel-type',
      isActiveVariable: 'var-active',
      isGestationalCarrierVariable: 'var-gestational',
    },
    censusPrompt: 'Tell us about your family',
    ...overrides,
  } as Stage;
}

describe('generateNetwork', () => {
  describe('FamilyPedigree stage', () => {
    it('should use nodeConfig.type for node types, not a hardcoded fallback', () => {
      const codebook = makeCodebook();
      const stages = [makeFamilyPedigreeStage()];

      const { network } = generateNetwork(codebook, stages, 42);

      expect(network.nodes.length).toBeGreaterThan(0);

      for (const node of network.nodes) {
        expect(node.type).toBe('node-type-1');
      }
    });

    it('should use edgeConfig.type for edge types', () => {
      const codebook = makeCodebook();
      const stages = [makeFamilyPedigreeStage()];

      const { network } = generateNetwork(codebook, stages, 42);

      expect(network.edges.length).toBeGreaterThan(0);

      for (const edge of network.edges) {
        expect(edge.type).toBe('edge-type-1');
      }
    });

    it('should only produce node types that exist in the codebook', () => {
      const codebook = makeCodebook();
      const stages = [makeFamilyPedigreeStage()];

      const { network } = generateNetwork(codebook, stages, 42);

      const codebookNodeTypes = new Set(Object.keys(codebook.node ?? {}));

      for (const node of network.nodes) {
        expect(codebookNodeTypes.has(node.type)).toBe(true);
      }
    });

    it('should generate attributes from the codebook node type definition', () => {
      const codebook = makeCodebook();
      const stages = [makeFamilyPedigreeStage()];

      const { network } = generateNetwork(codebook, stages, 42);

      for (const node of network.nodes) {
        const attrs = node[entityAttributesProperty];
        expect(attrs).toHaveProperty('var-name');
      }
    });

    it('should not create nodes when nodeConfig is missing', () => {
      const codebook = makeCodebook();
      const stages = [
        makeFamilyPedigreeStage({
          nodeConfig: undefined,
          edgeConfig: undefined,
        }),
      ];

      const { network } = generateNetwork(codebook, stages, 42);

      expect(network.nodes.length).toBe(0);
      expect(network.edges.length).toBe(0);
    });
  });

  describe('all node types match codebook', () => {
    it('should never produce nodes with type "person" or "Unknown"', () => {
      const codebook = makeCodebook();
      const stages: Stage[] = [
        {
          id: 'stage-ng',
          label: 'Name Generator',
          type: 'NameGenerator',
          subject: { entity: 'node', type: 'node-type-1' },
          prompts: [{ id: 'prompt-1', text: 'Add people' }],
          behaviours: { minNodes: 2, maxNodes: 5 },
        } as Stage,
        makeFamilyPedigreeStage(),
      ];

      const { network } = generateNetwork(codebook, stages, 42);

      for (const node of network.nodes) {
        expect(node.type).not.toBe('person');
        expect(node.type).not.toBe('Unknown');
        expect(node.type).toBe('node-type-1');
      }
    });
  });

  describe('stage type coverage', () => {
    it('should handle every stage type defined in the protocol validation schema', () => {
      const allStageTypes = getAllStageTypes();
      expect(allStageTypes.length).toBeGreaterThan(0);

      const codebook = makeCodebook();

      for (const stageType of allStageTypes) {
        const stage = {
          id: `stage-${stageType}`,
          label: stageType,
          type: stageType,
          // Properties used by various stage types — include all so that
          // whichever branch runs has something to work with.
          subject: { entity: 'node', type: 'node-type-1' },
          prompts: [{ id: 'prompt-1', text: 'Test prompt' }],
          // FamilyPedigree-specific
          nodeConfig: {
            type: 'node-type-1',
            nodeLabelVariable: 'var-name',
            egoVariable: 'var-ego',
            biologicalSexVariable: 'var-sex',
            relationshipVariable: 'var-rel',
          },
          edgeConfig: {
            type: 'edge-type-1',
            relationshipTypeVariable: 'var-rel-type',
            isActiveVariable: 'var-active',
            isGestationalCarrierVariable: 'var-gestational',
          },
          censusPrompt: 'Test',
        } as Stage;

        expect(
          () => generateNetwork(codebook, [stage], 42),
          `Stage type "${stageType}" is not handled by generateNetwork`,
        ).not.toThrow();
      }
    });

    it('should throw for an unknown stage type', () => {
      const codebook = makeCodebook();
      const stage = {
        id: 'stage-unknown',
        label: 'Unknown',
        type: 'SomeNewStageType',
      } as unknown as Stage;

      expect(() => generateNetwork(codebook, [stage], 42)).toThrow(
        /Unsupported stage type "SomeNewStageType"/,
      );
    });
  });
});
