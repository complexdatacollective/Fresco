import {
  type ComponentTypesKeys,
  type VariableTypesKeys,
} from '@codaco/protocol-validation';

export type VariableType = (typeof VariableTypesKeys)[number];
export type ComponentType = (typeof ComponentTypesKeys)[number];

export type VariableOption = {
  label: string;
  value: number | string;
};

export type VariableEntry = {
  id: string;
  name: string;
  type: VariableType;
  component?: ComponentType;
  options?: VariableOption[];
  validation?: Record<string, unknown>;
};

type ShapeMapping =
  | {
      variable: string;
      type: 'discrete';
      map: { value: string | number | boolean; shape: string }[];
    }
  | {
      variable: string;
      type: 'breakpoints';
      thresholds: { value: number; shape: string }[];
    };

export type NodeTypeEntry = {
  id: string;
  name: string;
  color: string;
  icon: string;
  shape: { default: string; dynamic?: ShapeMapping };
  variables: Map<string, VariableEntry>;
};

export type EdgeTypeEntry = {
  id: string;
  name: string;
  color: string;
  variables: Map<string, VariableEntry>;
};

export type StageType =
  | 'NameGenerator'
  | 'NameGeneratorQuickAdd'
  | 'NameGeneratorRoster'
  | 'Sociogram'
  | 'Narrative'
  | 'DyadCensus'
  | 'OneToManyDyadCensus'
  | 'OrdinalBin'
  | 'CategoricalBin'
  | 'EgoForm'
  | 'Information'
  | 'TieStrengthCensus'
  | 'AlterForm'
  | 'AlterEdgeForm'
  | 'Anonymisation'
  | 'FamilyPedigree'
  | 'Geospatial';

export type NameGeneratorPromptEntry = {
  id: string;
  text: string;
  additionalAttributes?: { variable: string; value: boolean }[];
};

export type SociogramPromptEntry = {
  id: string;
  text: string;
  layout: {
    layoutVariable: string;
  };
  sortOrder?: { property: string; direction: 'asc' | 'desc' }[];
  edges?: {
    create?: string;
    display?: string[];
  };
  highlight?: {
    allowHighlighting?: boolean;
    variable?: string;
  };
};

type SortRule = {
  property: string;
  direction: 'asc' | 'desc';
};

export type DyadCensusPromptEntry = {
  id: string;
  text: string;
  createEdge: string;
};

export type OneToManyDyadCensusPromptEntry = {
  id: string;
  text: string;
  createEdge: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
};

export type OrdinalBinPromptEntry = {
  id: string;
  text: string;
  variable: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
  color?: string;
};

export type CategoricalBinPromptEntry = {
  id: string;
  text: string;
  variable: string;
  otherVariable?: string;
  otherVariablePrompt?: string;
  otherOptionLabel?: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
};

export type TieStrengthCensusPromptEntry = {
  id: string;
  text: string;
  createEdge: string;
  edgeVariable: string;
  negativeLabel: string;
};

export type DiseaseNominationStepEntry = {
  id: string;
  text: string;
  variable: string;
};

export type GeospatialPromptEntry = {
  id: string;
  text: string;
  variable: string;
};

type MapOptionsEntry = {
  tokenAssetId: string;
  style: string;
  center: [number, number];
  initialZoom: number;
  dataSourceAssetId: string;
  color: string;
  targetFeatureProperty: string;
  showTransit?: boolean;
  allowSearch?: boolean;
};

type PromptEntry =
  | NameGeneratorPromptEntry
  | SociogramPromptEntry
  | DyadCensusPromptEntry
  | OneToManyDyadCensusPromptEntry
  | OrdinalBinPromptEntry
  | CategoricalBinPromptEntry
  | TieStrengthCensusPromptEntry
  | GeospatialPromptEntry;

export type PresetEntry = {
  id: string;
  label: string;
  layoutVariable: string;
  edges?: {
    display: string[];
  };
  groupVariable?: string;
  highlight?: string[];
};

type FormFieldEntry = {
  variable: string;
  component?: ComponentType;
  prompt?: string;
};

type FormEntry = {
  title: string;
  fields: FormFieldEntry[];
};

type PanelEntry = {
  id: string;
  title: string;
  dataSource: string;
};

type InformationItem = {
  id: string;
  type: 'text';
  content: string;
};

export type StageEntry = {
  id: string;
  type: StageType;
  label: string;
  subject?: { entity: 'node'; type: string } | { entity: 'edge'; type: string };
  form?: FormEntry;
  prompts: PromptEntry[];
  presets: PresetEntry[];
  panels: PanelEntry[];
  background?: {
    concentricCircles?: number;
    skewedTowardCenter?: boolean;
    image?: string;
  };
  behaviours?: {
    automaticLayout?: { enabled: boolean };
    freeDraw?: boolean;
    allowRepositioning?: boolean;
    removeAfterConsideration?: boolean;
    minNodes?: number;
    maxNodes?: number;
  };
  introductionPanel?: {
    title: string;
    text: string;
  };
  title?: string;
  items?: InformationItem[];
  initialNodes: number;
  initialEdges: [number, number][];
  // NameGeneratorQuickAdd
  quickAdd?: string;
  // NameGeneratorRoster
  dataSource?: string;
  cardOptions?: {
    displayLabel: string;
    additionalProperties?: { label: string; variable: string }[];
  };
  sortOptions?: {
    sortOrder: SortRule[];
    sortableProperties: { variable: string; label: string }[];
  };
  searchOptions?: {
    fuzziness: number;
    matchProperties: string[];
  };
  // Anonymisation
  explanationText?: {
    title: string;
    body: string;
  };
  // TieStrengthCensus (edge type reference on stage)
  edgeType?: { entity: 'edge'; type: string };
  // FamilyPedigree-specific fields
  nodeConfig?: {
    type: string;
    nodeLabelVariable: string;
    egoVariable: string;
    relationshipVariable: string;
    form: { variable: string; prompt: string }[];
  };
  edgeConfig?: {
    type: string;
    relationshipTypeVariable: string;
    isActiveVariable: string;
    isGestationalCarrierVariable: string;
  };
  censusPrompt?: string;
  nominationPrompts?: { id: string; text: string; variable: string }[];
  // Geospatial
  mapOptions?: MapOptionsEntry;
};

export type NodeEntry = {
  uid: string;
  type: string;
  stageId: string;
  promptIDs: string[];
  explicitAttributes: Record<string, unknown>;
};

export type EdgeEntry = {
  uid: string;
  type: string;
  from: string;
  to: string;
  attributes: Record<string, unknown>;
};

// --- Input types for builder methods ---

export type AddNodeTypeInput = {
  name?: string;
  color?: string;
  icon?: string;
  shape?: { default: string; dynamic?: ShapeMapping };
};

export type AddEdgeTypeInput = {
  name?: string;
  color?: string;
};

export type AddVariableInput = {
  id?: string;
  name?: string;
  type?: VariableType;
  component?: ComponentType;
  options?: VariableOption[];
  validation?: Record<string, unknown>;
};

export type FormFieldInput = {
  variable?: string;
  prompt?: string;
  component: ComponentType;
  validation?: Record<string, unknown>;
};

export type AddStageInput = {
  label?: string;
  subject?: { entity: 'node'; type: string } | { entity: 'edge'; type: string };
  initialNodes?: number;
  initialEdges?: [number, number][];
  background?: {
    concentricCircles?: number;
    skewedTowardCenter?: boolean;
    image?: string;
  };
  behaviours?: {
    automaticLayout?: { enabled: boolean };
    freeDraw?: boolean;
    allowRepositioning?: boolean;
    removeAfterConsideration?: boolean;
    minNodes?: number;
    maxNodes?: number;
  };
  form?: {
    title?: string;
    fields: FormFieldInput[];
  };
  introductionPanel?: {
    title?: string;
    text?: string;
  };
  // NameGeneratorQuickAdd
  quickAdd?: string;
  // NameGeneratorRoster
  dataSource?: string;
  cardOptions?: {
    displayLabel?: string;
    additionalProperties?: { label: string; variable: string }[];
  };
  sortOptions?: {
    sortOrder?: SortRule[];
    sortableProperties?: { variable: string; label: string }[];
  };
  searchOptions?: {
    fuzziness?: number;
    matchProperties?: string[];
  };
  // Anonymisation
  explanationText?: {
    title?: string;
    body?: string;
  };
  // FamilyPedigree
  nodeConfig?: {
    type: string;
    nodeLabelVariable: string;
    egoVariable: string;
    relationshipVariable: string;
    form?: { variable: string; prompt: string }[];
  };
  edgeConfig?: {
    type: string;
    relationshipTypeVariable: string;
    isActiveVariable?: string;
    isGestationalCarrierVariable?: string;
  };
  censusPrompt?: string;
  nominationPrompts?: { id: string; text: string; variable: string }[];
  // Geospatial
  mapOptions?: MapOptionsEntry;
};

export type AddPromptInput = {
  text?: string;
  layout?: {
    layoutVariable?: string;
  };
  edges?: {
    create?: boolean | string;
    display?: string[];
  };
  highlight?: {
    variable?: string | boolean;
  };
};

export type AddDyadCensusPromptInput = {
  text?: string;
  createEdge?: boolean | string;
};

export type AddOneToManyDyadCensusPromptInput = {
  text?: string;
  createEdge?: boolean | string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
};

export type AddOrdinalBinPromptInput = {
  text?: string;
  variable?: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
  color?: string;
};

export type AddCategoricalBinPromptInput = {
  text?: string;
  variable?: string;
  otherVariable?: string;
  otherVariablePrompt?: string;
  otherOptionLabel?: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
};

export type AddTieStrengthCensusPromptInput = {
  text?: string;
  createEdge?: boolean | string;
  edgeVariable?: string;
  negativeLabel?: string;
};

export type AddDiseaseNominationStepInput = {
  text?: string;
  variable?: string;
};

export type AddGeospatialPromptInput = {
  text?: string;
  variable?: string;
};

export type AddPresetInput = {
  label?: string;
  layoutVariable?: string;
  edges?: {
    display?: string[];
  };
  groupVariable?: string | boolean;
  highlight?: string[] | boolean;
};

export type GetSessionInput = {
  currentStep?: number;
  promptIndex?: number;
  stageMetadata?: Record<number, unknown> | null;
};
