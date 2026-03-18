import { z } from 'zod/mini';
import { type Option } from '~/components/DataTable/types';

export type RangePreset = {
  label: string;
  min: number;
  max: number;
};

export type RangeFilterConfig = {
  type: 'range';
  min: number;
  max: number;
  step?: number;
  presets?: RangePreset[];
  formatLabel?: (value: number) => string;
};

export type DateFilterConfig = {
  type: 'date';
};

export type BooleanFilterConfig = {
  type: 'boolean';
  trueLabel: string;
  falseLabel: string;
};

export type FacetedFilterConfig = {
  type: 'faceted';
  options: Option[] | ((data: unknown[]) => Option[]);
};

export type OperatorFilterConfig = {
  type: 'operator';
  operators: ('eq' | 'gt' | 'lt' | 'gte' | 'lte')[];
  entitySelector?: {
    label: string;
    getOptions: (data: unknown[]) => Option[];
  };
};

export type FilterConfig =
  | RangeFilterConfig
  | DateFilterConfig
  | BooleanFilterConfig
  | FacetedFilterConfig
  | OperatorFilterConfig;

export type RangeFilterValue = {
  min: number;
  max: number;
};

export type DateFilterValue = {
  from: string;
  to: string;
};

export type BooleanFilterValue = boolean;

export type FacetedFilterValue = string[];

export type OperatorCondition = {
  entityType: string;
  entityKind: 'nodes' | 'edges';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: number;
};

export type OperatorFilterValue = {
  conditions: OperatorCondition[];
};

export type FilterValue =
  | RangeFilterValue
  | DateFilterValue
  | BooleanFilterValue
  | FacetedFilterValue
  | OperatorFilterValue;

// z.unknown() is intentional — each filter component validates its own value shape
export const ColumnFiltersStateSchema = z.array(
  z.object({
    id: z.string(),
    value: z.unknown(),
  }),
);
