import { type VariableValue } from './variables';

export const entityPrimaryKeyProperty = '_uid' as const;
export const entitySecureAttributesMeta = '_secureAttributes' as const;
export const entityAttributesProperty = 'attributes' as const;
export const edgeSourceProperty = 'from' as const;
export const edgeTargetProperty = 'to' as const;

export type NcEntity = {
  readonly [entityPrimaryKeyProperty]: string;
  type?: string;
  [entityAttributesProperty]: Record<string, VariableValue>;
  [entitySecureAttributesMeta]?: Record<
    string,
    { iv: number[]; salt: number[] }
  >;
};

export type NcNode = NcEntity & {
  type: string;
  stageId?: string;
  promptIDs?: string[];
  displayVariable?: string; // @deprecated
};

export type NcEdge = NcEntity & {
  type: string;
  from: string;
  to: string;
};

export type NcEgo = NcEntity;

export type NcNetwork = {
  nodes: NcNode[];
  edges: NcEdge[];
  ego?: NcEgo;
};
