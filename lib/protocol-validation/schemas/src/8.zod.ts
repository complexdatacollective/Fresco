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
    component: componentEnum.optional(),
    options: optionsSchema,
    parameters: z.record(z.any()).optional(),
    validation: validationSchema.optional(),
  })
  .strict();

// Node, Edge, and Ego Schemas
const nodeSchema = z
  .object({
    name: z.string(),
    displayVariable: z.string().optional(),
    iconVariant: z.string().optional(),
    variables: z.record(variableSchema),
    color: z.string(),
  })
  .strict();

const edgeSchema = z
  .object({
    name: z.string(),
    color: z.string(),
    variables: z.record(variableSchema),
  })
  .strict();

const egoSchema = z
  .object({
    variables: z.record(variableSchema),
  })
  .strict();

// Codebook Schema
const codebookSchema = z
  .object({
    node: z.record(z.union([nodeSchema, z.never()])),
    edge: z.record(z.union([edgeSchema, z.never()])),
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
    additionalAttributes: z
      .array(
        z
          .object({
            variable: z.string(),
            value: z.union([z.boolean()]),
          })
          .strict(),
      )
      .optional(),
    variable: z.string().optional(),
    edgeVariable: z.string().optional(),
    negativeLabel: z.string().optional(),
    otherVariable: z.string().optional(),
    otherVariablePrompt: z.string().optional(),
    otherOptionLabel: z.string().optional(),
    bucketSortOrder: sortOrderSchema.optional(),
    binSortOrder: sortOrderSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
    color: z.string().optional(),
    layout: z
      .object({
        layoutVariable: z.union([z.string(), z.record(z.any())]),
        allowPositioning: z.boolean().optional(),
      })
      .strict()
      .optional(),
    edges: z
      .object({
        display: z.array(z.string()).optional(),
        create: z.string().optional(),
        restrict: z
          .object({
            origin: z.string().optional(),
            destination: z.enum(['same', 'different', 'all']).optional(),
          })
          .optional(),
      })
      .strict()
      .optional(),
    highlight: z
      .object({
        variable: z.string().optional(),
        allowHighlighting: z.boolean(),
      })
      .strict()
      .optional(),
    createEdge: z.string().optional(),
  })
  .strict();

const stageSchema = z
  .object({
    id: z.string(),
    interviewScript: z.string().optional(),
    type: z.enum([
      'Narrative',
      'AlterForm',
      'AlterEdgeForm',
      'EgoForm',
      'NameGenerator',
      'NameGeneratorQuickAdd',
      'NameGeneratorRoster',
      'Sociogram',
      'DyadCensus',
      'TieStrengthCensus',
      'Information',
      'OrdinalBin',
      'CategoricalBin',
      'Anonymisation',
      'OneToManyDyadCensus',
      'FamilyTreeCensus',
    ]),
    label: z.string(),
    form: z
      .union([
        z
          .object({
            title: z.string().optional(),
            fields: z.array(
              z.object({ variable: z.string(), prompt: z.string() }).strict(),
            ),
          })
          .strict(),
        z.null(),
      ])
      .optional(),
    quickAdd: z.union([z.string(), z.null()]).optional(),
    createEdge: z.string().optional(),
    dataSource: z.union([z.string(), z.null()]).optional(),
    subject: z
      .object({
        entity: z.enum(['edge', 'node', 'ego']),
        type: z.string(),
      })
      .strict()
      .optional(),
    panels: z.array(panelSchema).optional(),
    prompts: z.array(promptSchema).min(1).optional(),
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
                create: z.string().optional(),
                restrict: z
                  .object({
                    origin: z.string().optional(),
                    destination: z
                      .enum(['same', 'different', 'all'])
                      .optional(),
                  })
                  .optional(),
              })
              .strict()
              .optional(),
            highlight: z.array(z.string()).optional(),
          })
          .strict(),
      )
      .min(1)
      .optional(),
    background: z
      .object({
        image: z.string().optional(),
        concentricCircles: z.number().int().optional(),
        skewedTowardCenter: z.boolean().optional(),
      })
      .strict()
      .optional(),
    sortOptions: z
      .object({
        sortOrder: sortOrderSchema,
        sortableProperties: z.array(
          z.object({ label: z.string(), variable: z.string() }).strict(),
        ),
      })
      .strict()
      .optional(),
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
    behaviours: z
      .object({
        minNodes: z.number().int().optional(),
        maxNodes: z.number().int().optional(),
        freeDraw: z.boolean().optional(),
        featureNode: z.boolean().optional(),
        allowRepositioning: z.boolean().optional(),
        automaticLayout: z.object({ enabled: z.boolean() }).strict().optional(),
      })
      .catchall(z.any())
      .optional(),
    showExistingNodes: z.boolean().optional(),
    title: z.string().optional(),
    items: z
      .array(
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
      )
      .optional(),
    introductionPanel: z
      .object({ title: z.string(), text: z.string() })
      .strict()
      .optional(),
    skipLogic: z
      .object({
        action: z.enum(['SHOW', 'SKIP']),
        filter: z.union([filterSchema, z.null()]),
      })
      .strict()
      .optional(),
    filter: z.union([filterSchema, z.null()]).optional(),
  })
  .strict();

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
