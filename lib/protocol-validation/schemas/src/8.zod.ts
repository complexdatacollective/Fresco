import { z } from 'zod';

// Constants for repeated values
const validVariableName = /^[a-zA-Z0-9._:-]+$/;

// Enums
const componentEnum = z.enum([
  'Boolean',
  'CheckboxGroup',
  'Number',
  'RadioGroup',
  'Text',
  'TextArea',
  'Toggle',
  'ToggleButtonGroup',
  'Slider',
  'VisualAnalogScale',
  'LikertScale',
  'DatePicker',
  'RelativeDatePicker',
]);

const typeEnum = z.enum([
  'boolean',
  'text',
  'number',
  'datetime',
  'ordinal',
  'scalar',
  'categorical',
  'layout',
  'location',
]);

// Validation Schema
const validationSchema = z
  .object({
    required: z.boolean().optional(),
    requiredAcceptsNull: z.boolean().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    minValue: z.number().int().optional(),
    maxValue: z.number().int().optional(),
    minSelected: z.number().int().optional(),
    maxSelected: z.number().int().optional(),
    unique: z.boolean().optional(),
    differentFrom: z.string().optional(),
    sameAs: z.string().optional(),
    greaterThanVariable: z.string().optional(),
    lessThanVariable: z.string().optional(),
  })
  .strict();

// Options Schema
const optionsSchema = z
  .array(
    z.union([
      z
        .object({
          label: z.string(),
          value: z.union([
            z.number().int(),
            z.string().regex(validVariableName),
            z.boolean(),
          ]),
          negative: z.boolean().optional(),
        })
        .strict(),
      z.number().int(),
      z.string(),
    ]),
  )
  .optional();

// Variable Schema
const variableSchema = z
  .object({
    name: z.string().regex(validVariableName),
    type: typeEnum,
    encrypted: z.boolean().optional(),
    component: componentEnum.optional(),
    options: optionsSchema,
    parameters: z.record(z.any()).optional(),
    validation: validationSchema.optional(),
  })
  .strict();
type Variable = z.infer<typeof variableSchema>;

const VariablesSchema = z.record(
  z.string().regex(validVariableName),
  variableSchema,
);
type Variables = z.infer<typeof VariablesSchema>;

// Node, Edge, and Ego Schemas
const nodeSchema = z
  .object({
    name: z.string(),
    displayVariable: z.string().optional(),
    iconVariant: z.string().optional(),
    variables: VariablesSchema,
    color: z.string(),
  })
  .strict();

type Node = z.infer<typeof nodeSchema>;

const edgeSchema = z
  .object({
    name: z.string(),
    color: z.string(),
    variables: VariablesSchema,
  })
  .strict();

const egoSchema = z
  .object({
    variables: VariablesSchema,
  })
  .strict();

// Codebook Schema
const codebookSchema = z
  .object({
    node: z.record(z.union([nodeSchema, z.never()])),
    edge: z.record(z.union([edgeSchema, z.never()])).optional(),
    ego: egoSchema.optional(),
  })
  .strict();

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

const nameGeneratorStage = baseStageSchema.extend({
  type: z.literal('NameGenerator'),
  form: formFieldsSchema,
  subject: subjectSchema,
  panels: z.array(panelSchema).optional(),
  prompts: z.array(promptSchema).min(1),
});

const nameGeneratorQuickAddStage = baseStageSchema.extend({
  type: z.literal('NameGeneratorQuickAdd'),
  quickAdd: z.string(),
  subject: subjectSchema,
  panels: z.array(panelSchema).optional(),
  prompts: z.array(promptSchema).min(1),
  behaviours: z
    .object({
      minNodes: z.number().int().optional(),
      maxNodes: z.number().int().optional(),
    })
    .optional(),
});

const nameGeneratorRosterStage = baseStageSchema.extend({
  type: z.literal('NameGeneratorRoster'),
  subject: subjectSchema,
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
  prompts: z.array(promptSchema).min(1),
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

const oneToManyDyadCensusStage = baseStageSchema.extend({
  type: z.literal('OneToManyDyadCensus'),
  subject: subjectSchema,
  prompts: z
    .array(
      promptSchema.extend({
        createEdge: z.string(),
      }),
    )
    .min(1),
});

const familyTreeCensusStage = baseStageSchema.extend({
  type: z.literal('FamilyTreeCensus'),
});

const mapboxStyleOptions = [
  { label: 'Standard', value: 'mapbox://styles/mapbox/standard' },
  {
    label: 'Standard Satellite',
    value: 'mapbox://styles/mapbox/standard-satellite',
  },
  { label: 'Streets', value: 'mapbox://styles/mapbox/streets-v12' },
  { label: 'Outdoors', value: 'mapbox://styles/mapbox/outdoors-v12' },
  { label: 'Light', value: 'mapbox://styles/mapbox/light-v11' },
  { label: 'Dark', value: 'mapbox://styles/mapbox/dark-v11' },
  { label: 'Satellite', value: 'mapbox://styles/mapbox/satellite-v9' },
  {
    label: 'Satellite Streets',
    value: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  {
    label: 'Navigation Day',
    value: 'mapbox://styles/mapbox/navigation-day-v1',
  },
  {
    label: 'Navigation Night',
    value: 'mapbox://styles/mapbox/navigation-night-v1',
  },
];

const styleOptions = z.enum(
  mapboxStyleOptions.map((option) => option.value) as [string, ...string[]],
);

const mapOptions = z.object({
  tokenAssetId: z.string(),
  style: styleOptions,
  center: z.tuple([z.number(), z.number()]),
  initialZoom: z
    .number()
    .min(0, { message: 'Zoom must be at least 0' })
    .max(22, { message: 'Zoom must be less than or equal to 22' }),
  dataSourceAssetId: z.string(),
  color: z.string(),
  targetFeatureProperty: z.string(), // property of geojson to select
});

export type MapOptions = z.infer<typeof mapOptions>;

const geospatialStage = baseStageSchema.extend({
  type: z.literal('Geospatial'),
  subject: subjectSchema,
  mapOptions: mapOptions,
  prompts: z
    .array(
      promptSchema
        .extend({
          variable: z.string(),
        })
        .strict(),
    )
    .min(1),
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
  geospatialStage,
]);

const baseAssetSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video', 'network', 'geojson', 'apikey']),
  name: z.string(),
});

const fileAssetSchema = baseAssetSchema.extend({
  type: z.enum(['image', 'video', 'network', 'geojson']),
  source: z.string(),
});

const apiKeyAssetSchema = baseAssetSchema.extend({
  type: z.enum(['apikey']),
  value: z.string(),
});

const assetSchema = z.discriminatedUnion('type', [
  fileAssetSchema,
  apiKeyAssetSchema,
]);

// Main Protocol Schema
export const Protocol = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    lastModified: z.string().datetime().optional(),
    schemaVersion: z.literal(8),
    codebook: codebookSchema,
    assetManifest: z.record(z.string(), assetSchema).optional(),
    stages: z.array(stageSchema),
  })
  .strict();

export type Protocol = z.infer<typeof Protocol>;
