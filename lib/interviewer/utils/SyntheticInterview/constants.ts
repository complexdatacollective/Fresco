import {
  type ComponentType,
  type VariableOption,
  type VariableType,
} from './types';

export const COMPONENT_TO_VARIABLE_TYPE: Record<ComponentType, VariableType> = {
  Text: 'text',
  TextArea: 'text',
  Number: 'number',
  VisualAnalogScale: 'scalar',
  Boolean: 'boolean',
  Toggle: 'boolean',
  RadioGroup: 'ordinal',
  LikertScale: 'ordinal',
  CheckboxGroup: 'categorical',
  ToggleButtonGroup: 'categorical',
  DatePicker: 'datetime',
  RelativeDatePicker: 'datetime',
};

export const DEFAULT_ORDINAL_OPTIONS: VariableOption[] = [
  { label: 'Strongly disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly agree', value: 5 },
];

export const DEFAULT_CATEGORICAL_OPTIONS: VariableOption[] = [
  { label: 'Family', value: 1 },
  { label: 'Work', value: 2 },
  { label: 'School', value: 3 },
  { label: 'Neighborhood', value: 4 },
];

export const NODE_COLORS = [
  'node-color-seq-1',
  'node-color-seq-2',
  'node-color-seq-3',
  'node-color-seq-4',
  'node-color-seq-5',
];

export const EDGE_COLORS = [
  'edge-color-seq-1',
  'edge-color-seq-2',
  'edge-color-seq-3',
  'edge-color-seq-4',
  'edge-color-seq-5',
];

export const ORDINAL_COLORS = [
  'ord-color-seq-1',
  'ord-color-seq-2',
  'ord-color-seq-3',
  'ord-color-seq-4',
  'ord-color-seq-5',
  'ord-color-seq-6',
  'ord-color-seq-7',
  'ord-color-seq-8',
  'ord-color-seq-9',
  'ord-color-seq-10',
];
