export enum StageTypes {
  NameGenerator = 'NameGenerator',
  NameGeneratorQuickAdd = 'NameGeneratorQuickAdd',
  NameGeneratorRoster = 'NameGeneratorRoster',
  NameGeneratorList = 'NameGeneratorList',
  NameGeneratorAutoComplete = 'NameGeneratorAutoComplete',
  Sociogram = 'Sociogram',
  Information = 'Information',
  OrdinalBin = 'OrdinalBin',
  CategoricalBin = 'CategoricalBin',
  Narrative = 'Narrative',
  AlterForm = 'AlterForm',
  EgoForm = 'EgoForm',
  AlterEdgeForm = 'AlterEdgeForm',
  DyadCensus = 'DyadCensus',
  TieStrengthCensus = 'TieStrengthCensus',
}


export type SortOption = {
  property: string;
  direction: 'asc' | 'desc' | string;
};

export type PromptEdges = {
  display?: string[];
  create?: string;
}

export type AdditionalAttribute = {
  variable: string;
  value: boolean;
}

export type AdditionalAttributes = AdditionalAttribute[];

export type BasePrompt = {
  id: string;
  text: string;
};

export type NameGeneratorPrompt = BasePrompt & {
  additionalAttributes?: AdditionalAttributes;
};


export type SociogramPrompt = BasePrompt & {
  createEdge?: string;
  edgeVariable?: string;
  sortOrder?: SortOption[];
  layout?: {
    layoutVariable?: string;
  },
  edges?: PromptEdges;
  highlight?: {
    allowHighlighting?: boolean;
    variable?: string;
  }
};

export type FilterRule = {
  id: string;
  type: 'alter' | 'ego' | 'edge'; // TODO: This should be 'ego' | 'node' | 'edge'
  options: {
    type?: string,
    operator: "EXISTS" | "NOT_EXISTS" | "EXACTLY" | "NOT" | "GREATER_THAN" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN" | "LESS_THAN_OR_EQUAL" | "INCLUDES" | "EXCLUDES" | "OPTIONS_GREATER_THAN" | "OPTIONS_LESS_THAN" | "OPTIONS_EQUALS" | "OPTIONS_NOT_EQUALS" | string;
    attribute?: string;
    value?: boolean | number | string;
  }
}

export type FilterDefinition = {
  join: 'AND' | 'OR' | string;
  rules: FilterRule[];
}

export type SkipDefinition = {
  action: 'SKIP' | 'SHOW' | string;
  filter: FilterDefinition;
}

export type PresetDefinition = {
  id: string;
  label: string;
  layoutVariable: string;
  groupVariable?: string;
  edges?: {
    display?: string[];
  },
  highlight?: string[];
}

export type ItemDefinition = {
  id: string;
  type: 'asset' | 'text' | string;
  content: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | string;
};

export interface EgoStageSubject {
  entity: 'ego';
}

export interface NodeStageSubject {
  entity: 'node';
  type: string;
}

export interface EdgeStageSubject {
  entity: 'edge';
  type: string;
}

export type StageSubject = EgoStageSubject | NodeStageSubject | EdgeStageSubject;

export type FormField = {
  variable: string;
  prompt: string;
}

export type Form = {
  title: string;
  fields: FormField[];
}

export type Panel = {
  id: string;
  title: string;
  dataSource: "existing" | string;
  filter?: FilterDefinition;
}

export type BaseStage = {
  id: string;
  type: StageTypes;
  label: string;
  interviewScript?: string;
  filter?: FilterDefinition;
  skipLogic?: SkipDefinition;
}

export type BaseStageWithSubject = BaseStage & {
  subject: StageSubject;
}

export type NameGeneratorFormStage = BaseStageWithSubject & {
  type: StageTypes.NameGenerator;
  form: Form;
  prompts: NameGeneratorPrompt[];
  panels?: Panel[];
}

export type NameGeneratorQuickAddStage = BaseStageWithSubject & {
  type: StageTypes.NameGeneratorQuickAdd;
  quickAdd: string;
  prompts: NameGeneratorPrompt[];
  panels?: Panel[];
}

export type IntroductionPanel = {
  title: string;
  text: string;
}

export type EgoFormStage = BaseStage & {
  subject: EgoStageSubject;
  type: StageTypes.EgoForm;
  form: Form;
  introductionPanel: IntroductionPanel;
}

export type SociogramStage = BaseStageWithSubject & {
  type: StageTypes.Sociogram;
  background?: {
    image?: string;
    concentricCircles?: number;
    skewedTowardCenter?: boolean;
  }
  prompts: SociogramPrompt[];
  behaviours?: {
    automaticLayout?: {
      enabled: boolean;
    }
  }
}


export type Stage =
  NameGeneratorFormStage |
  NameGeneratorQuickAddStage |
  EgoFormStage;


// export interface Stage {
//   id: string;
//   type: string;
//   label: string;
//   title?: string; // Todo: remove this
//   interviewScript?: string;
//   form?: Form;
//   introductionPanel?: Object, // Todo: create a Panel type
//   subject?: StageSubject | StageSubject[];
//   panels?: object[];
//   prompts?: Prompt[];
//   quickAdd?: string,
//   behaviours?: object;
//   filter?: FilterDefinition;
//   skipLogic?: SkipDefinition;
//   dataSource?: string;
//   cardOptions?: object; // Todo: create a CardOptions type
//   sortOptions?: {
//     sortOrder: SortOption[];
//     sortableProperties: object[]; // Todo: create a SortableProperty type
//   }
//   background?: {
//     image?: string;
//     concentricCircles?: number;
//     skewedTowardCenter?: boolean;
//   }
//   searchOptions?: {
//     fuzziness?: number;
//     matchProperties?: string[];
//   }
//   presets?: PresetDefinition[];
//   items?: ItemDefinition[];
// }


// export type Prompt = {
//   createEdge?: string;
//   edgeVariable?: string;
//   negativeLabel?: string;
//   variable?: string;
//   bucketSortOrder?: SortOption[];
//   binSortOrder?: SortOption[];
//   color?: Color;
//   sortOrder?: SortOption[];
//   layout?: {
//     layoutVariable?: string;
//   },
//   edges?: PromptEdges;
//   highlight?: {
//     allowHighlighting?: boolean;
//     variable?: string;
//   }
//   otherVariable?: string;
//   otherVariablePrompt?: string;
//   otherOptionLabel?: string;
// };
