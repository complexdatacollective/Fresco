import {
  type ComponentTypesKeys,
  type VariableTypesKeys,
} from '@codaco/protocol-validation';

export type VariableType = (typeof VariableTypesKeys)[number];
export type ComponentType = (typeof ComponentTypesKeys)[number];

export type VariableOption = {
  label: string;
  value: number;
};

export type VariableEntry = {
  id: string;
  name: string;
  type: VariableType;
  component?: ComponentType;
  options?: VariableOption[];
  validation?: Record<string, unknown>;
};

export type NodeTypeEntry = {
  id: string;
  name: string;
  color: string;
  displayVariable: string;
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
  | 'Sociogram'
  | 'Narrative'
  | 'OneToManyDyadCensus';

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

export type SortRule = {
  property: string;
  direction: 'asc' | 'desc';
};

export type OneToManyDyadCensusPromptEntry = {
  id: string;
  text: string;
  createEdge: string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
};

export type PromptEntry =
  | NameGeneratorPromptEntry
  | SociogramPromptEntry
  | OneToManyDyadCensusPromptEntry;

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

export type FormFieldEntry = {
  variable: string;
  component: ComponentType;
};

export type FormEntry = {
  title: string;
  fields: FormFieldEntry[];
};

export type PanelEntry = {
  id: string;
  title: string;
  dataSource: string;
};

export type StageEntry = {
  id: string;
  type: StageType;
  label: string;
  subject?: {
    entity: 'node';
    type: string;
  };
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
  };
  initialNodes: number;
  initialEdges: [number, number][];
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
  displayVariable?: string;
};

export type AddEdgeTypeInput = {
  name?: string;
  color?: string;
};

export type AddVariableInput = {
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
};

export type AddStageInput = {
  label?: string;
  subject?: {
    entity: 'node';
    type: string;
  };
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
  };
  form?: {
    title?: string;
    fields: FormFieldInput[];
  };
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

export type AddOneToManyDyadCensusPromptInput = {
  text?: string;
  createEdge?: boolean | string;
  bucketSortOrder?: SortRule[];
  binSortOrder?: SortRule[];
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
};
