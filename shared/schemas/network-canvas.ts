import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';

export const ZNcEntity = z
  .object({
    [entityPrimaryKeyProperty]: z.string().readonly(),
    type: z.string().optional(),
    [entityAttributesProperty]: z.record(z.string(), z.any()),
  })
  .passthrough();

export const ZNcNode = ZNcEntity.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
  displayVariable: z.string().optional(),
}).passthrough(); // This is here incase I missed anything

export const ZNcEdge = ZNcEntity.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
}).passthrough(); // This is here incase I missed anything

export const ZNcNetwork = z.object({
  nodes: z.array(ZNcNode),
  edges: z.array(ZNcEdge),
  ego: ZNcEntity.optional(),
});

export type NcNetwork = z.infer<typeof ZNcNetwork>;
