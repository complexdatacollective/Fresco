import { z } from 'zod';
import { validVariableNameSchema } from './variables';

const encryptedValueSchema = z.array(z.number());

export type EncryptedValue = z.infer<typeof encryptedValueSchema>;

const variableValueSchema = z.union([
  z.string(),
  z.array(z.unknown()), // remove
  z.boolean(),
  z.number(),
  encryptedValueSchema,
  z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
]);

export type VariableValue = z.infer<typeof variableValueSchema>;

export const entityPrimaryKeyProperty = '_uid' as const;
export type EntityPrimaryKey = typeof entityPrimaryKeyProperty;
export const entitySecureAttributesMeta = '_secureAttributes' as const;
export type EntitySecureAttributesMeta = typeof entitySecureAttributesMeta;
export const entityAttributesProperty = 'attributes' as const;
export type EntityAttributesProperty = typeof entityAttributesProperty;
export const edgeSourceProperty = 'from' as const;
export const edgeTargetProperty = 'to' as const;

const NcEntitySchema = z.object({
  [entityPrimaryKeyProperty]: z.string().readonly(),
  [entityAttributesProperty]: z.record(
    validVariableNameSchema,
    variableValueSchema,
  ),
  [entitySecureAttributesMeta]: z
    .record(
      z.object({
        iv: z.array(z.number()),
        salt: z.array(z.number()),
      }),
    )
    .optional(),
});

export type NcEntity = z.infer<typeof NcEntitySchema>;

const NcNodeSchema = NcEntitySchema.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
});

export type NcNode = z.infer<typeof NcNodeSchema>;

export const NcEdgeSchema = NcEntitySchema.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
});

export type NcEdge = z.infer<typeof NcEdgeSchema>;

export type NcEgo = NcEntity;

export type NcNetwork = {
  nodes: NcNode[];
  edges: NcEdge[];
  ego?: NcEgo;
};
