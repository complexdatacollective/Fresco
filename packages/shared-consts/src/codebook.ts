import { Color } from "./colors.js";
import { VariableDefinition } from "./variables.js";

// Docs: https://github.com/complexdatacollective/Network-Canvas/wiki/protocol.json#variable-registry
export enum CodebookEntityTypes {
  edge = 'edge',
  node = 'node',
}

export type CodebookEntityTypeDefinition = {
  name?: string,
  color?: Color,
  iconVariant?: string,
  variables: Record<string, VariableDefinition>;
};

export type CodebookNodeTypeDefinition = CodebookEntityTypeDefinition & {
  name: string;
  color: Color | string;
  displayVariable?: string; // @deprecated
};

export type CodebookEdgeTypeDefinition = CodebookNodeTypeDefinition;

export type Codebook = {
  node?: Record<string, CodebookNodeTypeDefinition>;
  edge?: Record<string, CodebookEdgeTypeDefinition>;
  ego?: CodebookEntityTypeDefinition;
};