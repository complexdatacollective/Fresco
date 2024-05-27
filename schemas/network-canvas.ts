import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';

// Not always used due to inconsistencies...
export const ZEntityType = z.enum(['ego', 'node', 'edge']);

const ZNcEntity = z.object({
  [entityPrimaryKeyProperty]: z.string().readonly(),
  type: ZEntityType.optional(),
  [entityAttributesProperty]: z.record(z.string(), z.any()),
});

export const ZNcNode = ZNcEntity.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
  displayVariable: z.string().optional(),
});

export type NcNode = z.infer<typeof ZNcNode>;

export const ZNcEdge = ZNcEntity.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
});

// Always use this instead of @codaco/shared-consts. Main difference is that ego is not optional.
export const ZNcNetwork = z.object({
  nodes: z.array(ZNcNode),
  edges: z.array(ZNcEdge),
  ego: ZNcEntity,
});

export type NcNetwork = z.infer<typeof ZNcNetwork>;

export const ZFilterRule = z.object({
  id: z.string(),
  type: z.enum(['alter', 'ego', 'edge']), // Should be ZEntityType
  options: z.object({
    type: z.string().optional(),
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
    ]),
    attribute: z.string().optional(),
    value: z.union([z.boolean(), z.number(), z.string()]).optional(),
  }),
});

export const ZFilterDefinition = z.object({
  join: z.enum(['AND', 'OR']),
  rules: z.array(ZFilterRule),
});

export const ZPanel = z.object({
  id: z.string(),
  title: z.string(),
  dataSource: z.string(),
  filter: ZFilterDefinition.optional(),
});

export type Panel = z.infer<typeof ZPanel>;

export const ZStageTypes = z.enum([
  'NameGenerator',
  'NameGeneratorQuickAdd',
  'NameGeneratorRoster',
  'NameGeneratorList',
  'NameGeneratorAutoComplete',
  'Sociogram',
  'Information',
  'OrdinalBin',
  'CategoricalBin',
  'Narrative',
  'AlterForm',
  'EgoForm',
  'AlterEdgeForm',
  'DyadCensus',
  'TieStrengthCensus',
]);

export const ZFormField = z.object({
  variable: z.string(),
  prompt: z.string(),
});

export const ZForm = z.object({
  title: z.string(),
  fields: z.array(ZFormField),
});

export const ZStageSubject = z.object({
  entity: ZEntityType,
  type: z.string(),
});

export const ZAdditionalAttribute = z.object({
  variable: z.string(),
  value: z.boolean(),
});

export const ZSortOption = z.object({
  property: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export const ZPromptEdges = z.object({
  display: z.array(z.string()).optional(),
  create: z.string().optional(),
});

export const ZPrompt = z.object({
  id: z.string(),
  text: z.string(),
  additionalAttributes: z.array(ZAdditionalAttribute).optional(),
  createEdge: z.string().optional(),
  edgeVariable: z.string().optional(),
  negativeLabel: z.string().optional(),
  variable: z.string().optional(),
  bucketSortOrder: z.array(ZSortOption).optional(),
  binSortOrder: z.array(ZSortOption).optional(),
  color: z.string().optional(),
  sortOrder: z.array(ZSortOption).optional(),
  layout: z
    .object({
      layoutVariable: z.string().optional(),
    })
    .optional(),
  edges: ZPromptEdges.optional(),
  highlight: z
    .object({
      allowHighlighting: z.boolean().optional(),
      variable: z.string().optional(),
    })
    .optional(),
  otherVariable: z.string().optional(),
  otherVariablePrompt: z.string().optional(),
  otherOptionLabel: z.string().optional(),
});

export const ZSkipDefinition = z.object({
  action: z.enum(['SKIP', 'SHOW']),
  filter: ZFilterDefinition,
});

export const ZPresetDefinition = z.object({
  id: z.string(),
  label: z.string(),
  layoutVariable: z.string(),
  groupVariable: z.string().optional(),
  edges: z
    .object({
      display: z.array(z.string()).optional(),
    })
    .optional(),
  highlight: z.array(z.string()).optional(),
});

export const ZItemDefinition = z.object({
  id: z.string(),
  type: z.enum(['asset', 'text']),
  content: z.string(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
});

// TODO: Break this down by stage type
export const ZStage = z.object({
  id: z.string(),
  type: ZStageTypes,
  label: z.string(),
  title: z.string().optional(),
  interviewScript: z.string().optional(),
  form: ZForm.optional(),
  introductionPanel: z.object({}).optional(),
  subject: ZStageSubject,
  panels: z.array(ZPanel).optional(),
  prompts: z.array(ZPrompt).optional(),
  quickAdd: z.string().optional(),
  behaviours: z
    .object({
      minNodes: z.number().optional(),
      maxNodes: z.number().optional(),
    })
    .optional(),
  filter: ZFilterDefinition.optional(),
  skipLogic: ZSkipDefinition.optional(),
  dataSource: z.string().optional(),
  cardOptions: z.object({}).optional(),
  sortOptions: z
    .object({
      sortOrder: z.array(ZSortOption),
      sortableProperties: z.array(z.object({})),
    })
    .optional(),
  background: z
    .object({
      image: z.string().optional(),
      concentricCircles: z.number().optional(),
      skewedTowardCenter: z.boolean().optional(),
    })
    .optional(),
  searchOptions: z
    .object({
      fuzziness: z.number().optional(),
      matchProperties: z.array(z.string()).optional(),
    })
    .optional(),
  presets: z.array(ZPresetDefinition).optional(),
  items: z.array(ZItemDefinition).optional(),
});

export type Stage = z.infer<typeof ZStage>;
