import { z } from 'zod';
import { VariablesSchema } from './variables';

// Docs: https://github.com/complexdatacollective/Network-Canvas/wiki/protocol.json#variable-registry
export enum EntityTypes {
  edge = 'edge',
  node = 'node',
}

// Node, Edge, and Ego Schemas
const nodeSchema = z
  .object({
    name: z.string(),
    iconVariant: z.string().optional(),
    variables: VariablesSchema.optional(),
    color: z.string(),
  })
  .strict();

export type NodeTypeDefinition = z.infer<typeof nodeSchema>;

const edgeSchema = z
  .object({
    name: z.string(),
    color: z.string(),
    variables: VariablesSchema.optional(),
  })
  .strict();

export type EdgeTypeDefinition = z.infer<typeof edgeSchema>;

const egoSchema = z
  .object({
    variables: VariablesSchema.optional(),
  })
  .strict();

export type EntityTypeDefinition = z.infer<typeof egoSchema>;

// Codebook Schema
export const codebookSchema = z
  .object({
    node: z.record(z.union([nodeSchema, z.never()])),
    edge: z.record(z.union([edgeSchema, z.never()])).optional(),
    ego: egoSchema.optional(),
  })
  .strict();

export type Codebook = z.infer<typeof codebookSchema>;
