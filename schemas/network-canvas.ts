import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';

const NcEntityZod = z.object({
  [entityPrimaryKeyProperty]: z.string().readonly(),
  type: z.string().optional(),
  [entityAttributesProperty]: z.record(z.string(), z.any()),
});

const NcNodeZod = NcEntityZod.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
  displayVariable: z.string().optional(),
});

const NcEdgeZod = NcEntityZod.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
});

export const NcNetworkZod = z.object({
  nodes: z.array(NcNodeZod),
  edges: z.array(NcEdgeZod),
  ego: NcEntityZod.optional(),
});
