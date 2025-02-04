import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';

const ZNcEntity = z.object({
  [entityPrimaryKeyProperty]: z.string().readonly(),
  [entityAttributesProperty]: z.record(z.string(), z.unknown()),
});

export type NcEntity = z.infer<typeof ZNcEntity>;

export const ZNcNode = ZNcEntity.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
  displayVariable: z.string().optional(),
});

export const ZNcEdge = ZNcEntity.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
});

// Always use this instead of @codaco/shared-consts. Main difference is that ego is not optional.
export const ZNcNetwork = z.object({
  nodes: z.array(ZNcNode),
  edges: z.array(ZNcEdge),
  ego: ZNcEntity,
});

export type NcNetwork = z.infer<typeof ZNcNetwork>;
