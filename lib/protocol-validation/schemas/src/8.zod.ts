import * as z from 'zod';

export const JoinSchema = z.enum(['AND', 'OR']);
export type Join = z.infer<typeof JoinSchema>;

export const OperatorSchema = z.enum([
  'CONTAINS',
  'DOES NOT CONTAIN',
  'EXACTLY',
  'EXCLUDES',
  'EXISTS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'INCLUDES',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'NOT',
  'NOT_EXISTS',
  'OPTIONS_EQUALS',
  'OPTIONS_GREATER_THAN',
  'OPTIONS_LESS_THAN',
  'OPTIONS_NOT_EQUALS',
]);
export type Operator = z.infer<typeof OperatorSchema>;

export const RuleTypeSchema = z.enum(['alter', 'edge', 'ego']);
export type RuleType = z.infer<typeof RuleTypeSchema>;

export const ItemTypeSchema = z.enum(['asset', 'text']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const DestinationSchema = z.enum(['all', 'different', 'same']);
export type Destination = z.infer<typeof DestinationSchema>;

export const DirectionSchema = z.enum(['asc', 'desc']);
export type Direction = z.infer<typeof DirectionSchema>;

export const SortOrderTypeSchema = z.enum([
  'boolean',
  'date',
  'hierarchy',
  'number',
  'string',
]);
export type SortOrderType = z.infer<typeof SortOrderTypeSchema>;

export const ActionSchema = z.enum(['SHOW', 'SKIP']);
export type Action = z.infer<typeof ActionSchema>;

export const EntitySchema = z.enum(['edge', 'ego', 'node']);
export type Entity = z.infer<typeof EntitySchema>;

export const InterfaceTypeSchema = z.enum([
  'AlterEdgeForm',
  'AlterForm',
  'CategoricalBin',
  'DyadCensus',
  'EgoForm',
  'Information',
  'NameGenerator',
  'NameGeneratorQuickAdd',
  'NameGeneratorRoster',
  'Narrative',
  'OrdinalBin',
  'Sociogram',
  'TieStrengthCensus',
  'Anonymisation',
  'OneToManyDyadCensus',
  'FamilyTreeCensus',
]);
export type InterfaceType = z.infer<typeof InterfaceTypeSchema>;

export const EdgeSchema = z.object({});
export type Edge = z.infer<typeof EdgeSchema>;

export const VariablesSchema = z.object({});
export type Variables = z.infer<typeof VariablesSchema>;

export const NodeSchema = z.object({});
export type Node = z.infer<typeof NodeSchema>;

export const BackgroundSchema = z.object({
  concentricCircles: z.number().optional(),
  image: z.string().optional(),
  skewedTowardCenter: z.boolean().optional(),
});
export type Background = z.infer<typeof BackgroundSchema>;

export const AutomaticLayoutSchema = z.object({
  enabled: z.boolean(),
});
export type AutomaticLayout = z.infer<typeof AutomaticLayoutSchema>;

export const PropertySchema = z.object({
  label: z.string(),
  variable: z.string(),
});
export type Property = z.infer<typeof PropertySchema>;

export const RuleOptionsSchema = z.object({
  attribute: z.string().optional(),
  operator: OperatorSchema,
  type: z.string().optional(),
  value: z
    .union([z.array(z.any()), z.boolean(), z.number(), z.string()])
    .optional(),
});
export type RuleOptions = z.infer<typeof RuleOptionsSchema>;

export const FieldSchema = z.object({
  prompt: z.string(),
  variable: z.string(),
});
export type Field = z.infer<typeof FieldSchema>;

export const IntroductionPanelSchema = z.object({
  text: z.string(),
  title: z.string(),
});
export type IntroductionPanel = z.infer<typeof IntroductionPanelSchema>;

export const ItemSchema = z.object({
  content: z.string(),
  description: z.string().optional(),
  id: z.string(),
  loop: z.boolean().optional(),
  size: z.string().optional(),
  type: ItemTypeSchema,
});
export type Item = z.infer<typeof ItemSchema>;

export const RestrictSchema = z.object({
  destination: DestinationSchema.optional(),
  origin: z.string().optional(),
});
export type Restrict = z.infer<typeof RestrictSchema>;

export const AdditionalAttributeSchema = z.object({
  value: z.boolean(),
  variable: z.string(),
});
export type AdditionalAttribute = z.infer<typeof AdditionalAttributeSchema>;

export const SortOrderSchema = z.object({
  direction: DirectionSchema.optional(),
  hierarchy: z.array(z.union([z.boolean(), z.number(), z.string()])).optional(),
  property: z.string(),
  type: SortOrderTypeSchema.optional(),
});
export type SortOrder = z.infer<typeof SortOrderSchema>;

export const HighlightSchema = z.object({
  allowHighlighting: z.boolean(),
  variable: z.string().optional(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const LayoutSchema = z.object({
  allowPositioning: z.boolean().optional(),
  layoutVariable: z.union([z.record(z.string(), z.any()), z.string()]),
});
export type Layout = z.infer<typeof LayoutSchema>;

export const SearchOptionsSchema = z.object({
  fuzziness: z.number(),
  matchProperties: z.array(z.string()),
});
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

export const SortOptionsSchema = z.object({
  sortableProperties: z.array(PropertySchema),
  sortOrder: z.array(SortOrderSchema),
});
export type SortOptions = z.infer<typeof SortOptionsSchema>;

export const SubjectSchema = z.object({
  entity: EntitySchema,
  type: z.string(),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const EgoSchema = z.object({
  variables: VariablesSchema.optional(),
});
export type Ego = z.infer<typeof EgoSchema>;

export const BehavioursSchema = z.object({
  allowRepositioning: z.boolean().optional(),
  automaticLayout: AutomaticLayoutSchema.optional(),
  featureNode: z.boolean().optional(),
  freeDraw: z.boolean().optional(),
  maxNodes: z.number().optional(),
  minNodes: z.number().optional(),
});
export type Behaviours = z.infer<typeof BehavioursSchema>;

export const CardOptionsSchema = z.object({
  additionalProperties: z.array(PropertySchema).optional(),
  displayLabel: z.string().optional(),
});
export type CardOptions = z.infer<typeof CardOptionsSchema>;

export const RuleSchema = z.object({
  id: z.string(),
  options: RuleOptionsSchema,
  type: RuleTypeSchema,
});
export type Rule = z.infer<typeof RuleSchema>;

export const FormSchema = z.object({
  fields: z.array(FieldSchema),
  title: z.string().optional(),
});
export type Form = z.infer<typeof FormSchema>;

export const EdgesSchema = z.object({
  create: z.string().optional(),
  display: z.array(z.string()).optional(),
  restrict: RestrictSchema.optional(),
});
export type Edges = z.infer<typeof EdgesSchema>;

export const PromptSchema = z.object({
  additionalAttributes: z.array(AdditionalAttributeSchema).optional(),
  binSortOrder: z.array(SortOrderSchema).optional(),
  bucketSortOrder: z.array(SortOrderSchema).optional(),
  color: z.string().optional(),
  createEdge: z.string().optional(),
  edges: EdgesSchema.optional(),
  edgeVariable: z.string().optional(),
  highlight: HighlightSchema.optional(),
  id: z.string(),
  layout: LayoutSchema.optional(),
  negativeLabel: z.string().optional(),
  otherOptionLabel: z.string().optional(),
  otherVariable: z.string().optional(),
  otherVariablePrompt: z.string().optional(),
  sortOrder: z.array(SortOrderSchema).optional(),
  text: z.string(),
  variable: z.string().optional(),
});
export type Prompt = z.infer<typeof PromptSchema>;

export const CodebookSchema = z.object({
  edge: EdgeSchema.optional(),
  ego: EgoSchema.optional(),
  node: NodeSchema.optional(),
});
export type Codebook = z.infer<typeof CodebookSchema>;

export const FilterSchema = z.object({
  join: JoinSchema.optional(),
  rules: z.array(RuleSchema).optional(),
});
export type Filter = z.infer<typeof FilterSchema>;

export const PanelSchema = z.object({
  dataSource: z.union([z.null(), z.string()]),
  filter: z.union([FilterSchema, z.null()]).optional(),
  id: z.string(),
  title: z.string(),
});
export type Panel = z.infer<typeof PanelSchema>;

export const PresetSchema = z.object({
  edges: EdgesSchema.optional(),
  groupVariable: z.string().optional(),
  highlight: z.array(z.string()).optional(),
  id: z.string(),
  label: z.string(),
  layoutVariable: z.string(),
});
export type Preset = z.infer<typeof PresetSchema>;

export const SkipLogicSchema = z.object({
  action: ActionSchema,
  filter: z.union([FilterSchema, z.null()]),
});
export type SkipLogic = z.infer<typeof SkipLogicSchema>;

export const InterfaceSchema = z.object({
  background: BackgroundSchema.optional(),
  behaviours: BehavioursSchema.optional(),
  cardOptions: CardOptionsSchema.optional(),
  createEdge: z.string().optional(),
  dataSource: z.union([z.null(), z.string()]).optional(),
  filter: z.union([FilterSchema, z.null()]).optional(),
  form: z.union([FormSchema, z.null()]).optional(),
  id: z.string(),
  interviewScript: z.string().optional(),
  introductionPanel: IntroductionPanelSchema.optional(),
  items: z.array(ItemSchema).optional(),
  label: z.string(),
  panels: z.array(PanelSchema).optional(),
  presets: z.array(PresetSchema).optional(),
  prompts: z.array(PromptSchema).optional(),
  quickAdd: z.union([z.null(), z.string()]).optional(),
  searchOptions: SearchOptionsSchema.optional(),
  showExistingNodes: z.boolean().optional(),
  skipLogic: SkipLogicSchema.optional(),
  sortOptions: SortOptionsSchema.optional(),
  subject: SubjectSchema.optional(),
  title: z.string().optional(),
  type: InterfaceTypeSchema,
});
export type Interface = z.infer<typeof InterfaceSchema>;

export const ProtocolSchema = z.object({
  assetManifest: z.record(z.string(), z.any()).optional(),
  codebook: CodebookSchema,
  description: z.string().optional(),
  lastModified: z.string().optional(),
  name: z.string().optional(),
  schemaVersion: z.literal(8),
  stages: z.array(InterfaceSchema),
});
export type Protocol = z.infer<typeof ProtocolSchema>;
