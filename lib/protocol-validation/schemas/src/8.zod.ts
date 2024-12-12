import { z } from 'zod';
import { codebookSchema } from '~/lib/shared-consts';

// Filter and Sort Options Schemas
const filterRuleSchema = z
  .object({
    type: z.enum(['alter', 'ego', 'edge']),
    id: z.string(),
    options: z
      .object({
        type: z.string().optional(),
        attribute: z.string().optional(),
        operator: z.enum([
          'EXISTS',
          'NOT_EXISTS',
          'EXACTLY',
          'NOT',
          'GREATER_THAN',
          'GREATER_THAN_OR_EQUAL',
          'LESS_THAN',
          'LESS_THAN_OR_EQUAL',
          'INCLUDES',
          'EXCLUDES',
          'OPTIONS_GREATER_THAN',
          'OPTIONS_LESS_THAN',
          'OPTIONS_EQUALS',
          'OPTIONS_NOT_EQUALS',
          'CONTAINS',
          'DOES NOT CONTAIN',
        ]),
        value: z
          .union([z.number().int(), z.string(), z.boolean(), z.array(z.any())])
          .optional(),
      })
      .strict()
      .and(z.any()),
  })
  .strict();

const filterSchema = z
  .object({
    join: z.enum(['OR', 'AND']).optional(),
    rules: z.array(filterRuleSchema).optional(),
  })
  .strict()
  .optional();

const sortOrderSchema = z.array(
  z
    .object({
      property: z.string(),
      direction: z.enum(['desc', 'asc']).optional(),
      type: z
        .enum(['string', 'number', 'boolean', 'date', 'hierarchy'])
        .optional(),
      hierarchy: z
        .array(z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    })
    .strict(),
);

// Stage and Related Schemas
const panelSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    filter: z.union([filterSchema, z.null()]).optional(),
    dataSource: z.union([z.string(), z.null()]),
  })
  .strict();

const promptSchema = z
  .object({
    id: z.string(),
    text: z.string(),
  })
  .strict();

const subjectSchema = z
  .object({
    entity: z.enum(['edge', 'node', 'ego']),
    type: z.string(),
  })
  .strict()
  .optional();

// Common schemas used across different stage types
const baseStageSchema = z.object({
  id: z.string(),
  interviewScript: z.string().optional(),
  label: z.string(),
  filter: z.union([filterSchema, z.null()]).optional(),
  skipLogic: z
    .object({
      action: z.enum(['SHOW', 'SKIP']),
      filter: z.union([filterSchema, z.null()]),
    })
    .strict()
    .optional(),
  introductionPanel: z
    .object({ title: z.string(), text: z.string() })
    .strict()
    .optional(),
});

const formFieldsSchema = z
  .object({
    title: z.string().optional(),
    fields: z.array(
      z.object({ variable: z.string(), prompt: z.string() }).strict(),
    ),
  })
  .strict();

// Individual stage schemas
const egoFormStage = baseStageSchema.extend({
  type: z.literal('EgoForm'),
  form: formFieldsSchema,
});

const alterFormStage = baseStageSchema.extend({
  type: z.literal('AlterForm'),
  subject: subjectSchema,
  form: formFieldsSchema,
});

const alterEdgeFormStage = baseStageSchema.extend({
  type: z.literal('AlterEdgeForm'),
  subject: subjectSchema,
  form: formFieldsSchema,
});

const baseNameGeneratorStage = baseStageSchema.extend({
  subject: subjectSchema,
  prompts: z.array(promptSchema).min(1),
  behaviours: z
    .object({
      minNodes: z.number().int().optional(),
      maxNodes: z.number().int().optional(),
    })
    .optional(),
});

const nameGeneratorStage = baseNameGeneratorStage.extend({
  type: z.literal('NameGenerator'),
  form: formFieldsSchema,
  panels: z.array(panelSchema).optional(),
});

const nameGeneratorQuickAddStage = baseNameGeneratorStage.extend({
  type: z.literal('NameGeneratorQuickAdd'),
  quickAdd: z.string(),
  panels: z.array(panelSchema).optional(),
});

export type NameGeneratorStageProps =
  | z.infer<typeof nameGeneratorStage>
  | z.infer<typeof nameGeneratorQuickAddStage>;

const nameGeneratorRosterStage = baseNameGeneratorStage.extend({
  type: z.literal('NameGeneratorRoster'),
  dataSource: z.string(),
  cardOptions: z
    .object({
      displayLabel: z.string().optional(),
      additionalProperties: z
        .array(z.object({ label: z.string(), variable: z.string() }).strict())
        .optional(),
    })
    .strict()
    .optional(),
  searchOptions: z
    .object({
      fuzziness: z.number(),
      matchProperties: z.array(z.string()),
    })
    .strict()
    .optional(),
});

const sociogramStage = baseStageSchema.extend({
  type: z.literal('Sociogram'),
  subject: subjectSchema,
  background: z
    .object({
      image: z.string().optional(),
      concentricCircles: z.number().int().optional(),
      skewedTowardCenter: z.boolean().optional(),
    })
    .strict()
    .optional(),
  behaviours: z
    .object({
      automaticLayout: z.object({ enabled: z.boolean() }).strict().optional(),
    })
    .catchall(z.any())
    .optional(),
  prompts: z.array(promptSchema).min(1),
});

const dyadCensusStage = baseStageSchema.extend({
  type: z.literal('DyadCensus'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        createEdge: z.string(),
      }),
    )
    .min(1),
});

const tieStrengthCensusStage = baseStageSchema.extend({
  type: z.literal('TieStrengthCensus'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        createEdge: z.string(),
        edgeVariable: z.string(),
        negativeLabel: z.string(),
      }),
    )
    .min(1),
});

const ordinalBinStage = baseStageSchema.extend({
  type: z.literal('OrdinalBin'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        variable: z.string(),
        bucketSortOrder: sortOrderSchema.optional(),
        binSortOrder: sortOrderSchema.optional(),
        color: z.string().optional(),
      }),
    )
    .min(1),
});

const categoricalBinStage = baseStageSchema.extend({
  type: z.literal('CategoricalBin'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        variable: z.string(),
        otherVariable: z.string().optional(),
        otherVariablePrompt: z.string().optional(),
        otherOptionLabel: z.string().optional(),
        bucketSortOrder: sortOrderSchema.optional(),
        binSortOrder: sortOrderSchema.optional(),
      }),
    )
    .min(1),
});

const narrativeStage = baseStageSchema.extend({
  type: z.literal('Narrative'),
  subject: subjectSchema,
  presets: z
    .array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          layoutVariable: z.string(),
          groupVariable: z.string().optional(),
          edges: z
            .object({
              display: z.array(z.string()).optional(),
            })
            .strict()
            .optional(),
          highlight: z.array(z.string()).optional(),
        })
        .strict(),
    )
    .min(1),
  background: z
    .object({
      concentricCircles: z.number().int().optional(),
      skewedTowardCenter: z.boolean().optional(),
    })
    .strict()
    .optional(),
  behaviours: z
    .object({
      freeDraw: z.boolean().optional(),
      allowRepositioning: z.boolean().optional(),
    })
    .strict()
    .optional(),
});

const informationStage = baseStageSchema.extend({
  type: z.literal('Information'),
  title: z.string().optional(),
  items: z.array(
    z
      .object({
        id: z.string(),
        type: z.enum(['text', 'asset']),
        content: z.string(),
        description: z.string().optional(),
        size: z.string().optional(),
        loop: z.boolean().optional(),
      })
      .strict(),
  ),
});

const anonymisationStage = baseStageSchema.extend({
  type: z.literal('Anonymisation'),
  items: z.array(
    z
      .object({
        id: z.string(),
        type: z.enum(['text', 'asset']),
        content: z.string(),
        size: z.string().optional(),
      })
      .strict(),
  ),
});

export type AnonymisationStage = z.infer<typeof anonymisationStage>;

const oneToManyDyadCensusStage = baseStageSchema.extend({
  type: z.literal('OneToManyDyadCensus'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        createEdge: z.string(),
        bucketSortOrder: sortOrderSchema.optional(),
      }),
    )
    .min(1),
});

const familyTreeCensusStage = baseStageSchema.extend({
  type: z.literal('FamilyTreeCensus'),
});

// Combine all stage types
const stageSchema = z.discriminatedUnion('type', [
  egoFormStage,
  alterFormStage,
  alterEdgeFormStage,
  nameGeneratorStage,
  nameGeneratorQuickAddStage,
  nameGeneratorRosterStage,
  sociogramStage,
  dyadCensusStage,
  tieStrengthCensusStage,
  ordinalBinStage,
  categoricalBinStage,
  narrativeStage,
  informationStage,
  anonymisationStage,
  oneToManyDyadCensusStage,
  familyTreeCensusStage,
]);

// Main Protocol Schema
export const Protocol = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    lastModified: z.string().datetime().optional(),
    schemaVersion: z.literal(8),
    codebook: codebookSchema,
    assetManifest: z.record(z.any()).optional(),
    stages: z.array(stageSchema),
  })
  .strict();

export type Protocol = z.infer<typeof Protocol>;
