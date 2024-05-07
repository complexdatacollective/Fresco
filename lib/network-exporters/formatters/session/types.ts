import {
  caseProperty,
  codebookHashProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';
import { ZNcEdge, ZNcEntity, ZNcNode } from '~/shared/schemas/network-canvas';

export const ZSessionVariables = z.object({
  [caseProperty]: z.string(),
  [sessionProperty]: z.string(),
  [protocolProperty]: z.string(),
  [protocolName]: z.string(),
  [codebookHashProperty]: z.string(),
  [sessionExportTimeProperty]: z.string(),
  [sessionStartTimeProperty]: z.string().optional(),
  [sessionFinishTimeProperty]: z.string().optional(),
  COMMIT_HASH: z.string(),
  APP_VERSION: z.string(),
});

export type SessionVariables = z.infer<typeof ZSessionVariables>;

export const ZFormattedSessionSchema = z.object({
  nodes: ZNcNode.array(),
  edges: ZNcEdge.array(),
  ego: ZNcEntity, // Should this be optional?
  sessionVariables: ZSessionVariables,
});

export type FormattedSession = z.infer<typeof ZFormattedSessionSchema>;
