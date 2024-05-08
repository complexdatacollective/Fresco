import {
  caseProperty,
  codebookHashProperty,
  edgeExportIDProperty,
  egoProperty,
  nodeExportIDProperty,
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

export const ExportOptionsSchema = z.object({
  exportGraphML: z.boolean(),
  exportCSV: z.boolean(),
  globalOptions: z.object({
    useScreenLayoutCoordinates: z.boolean(),
    screenLayoutHeight: z.number(),
    screenLayoutWidth: z.number(),
  }),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

export type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};

export type FormattedSession = z.infer<typeof ZFormattedSessionSchema>;

export type ExportFormat = 'graphml' | 'attributeList' | 'edgeList' | 'ego';

export type ExportFileProps = {
  fileName: string;
  exportFormat: ExportFormat;
  network: unknown;
  codebook: Codebook;
  exportOptions: ExportOptions;
};

export type ExportError = {
  id: string;
  success: false;
  error: Error;
};

export type ExportSuccess = {
  id: string;
  success: true;
  path: string;
};

export type ExportResult = ExportError | ExportSuccess;

export type ExportReturn = {
  status: 'success' | 'error' | 'cancelled' | 'partial';
  error: string | null;
  successfulExports?: ExportResult[];
  failedExports?: ExportResult[];
};

const ZNodeWithResequencedID = ZNodeWithEgo.extend({
  [nodeExportIDProperty]: z.number(),
});

export type NodeWithResequencedID = z.infer<typeof ZNodeWithResequencedID>;

const ZEdgeWithResequencedID = ZEdgeWithEgo.extend({
  [edgeExportIDProperty]: z.number(),
  from: z.number(),
  to: z.number(),
});

export type EdgeWithResequencedID = z.infer<typeof ZEdgeWithResequencedID>;

export const ZSessionWithResequencedIDs = ZSessionWithNetworkEgo.extend({
  nodes: ZNodeWithResequencedID.array(),
  edges: ZEdgeWithResequencedID.array(),
});

export type SessionWithResequencedIDs = z.infer<
  typeof ZSessionWithResequencedIDs
>;

export const ZNodeWithEgo = ZNcNode.extend({
  [egoProperty]: z.string(),
});

export type NodeWithEgo = z.infer<typeof ZNodeWithEgo>;

export const ZEdgeWithEgo = ZNcEdge.extend({
  [egoProperty]: z.string(),
});

export type EdgeWithEgo = z.infer<typeof ZEdgeWithEgo>;

export const ZSessionWithNetworkEgo = ZFormattedSessionSchema.extend({
  nodes: ZNodeWithEgo.array(),
  edges: ZEdgeWithEgo.array(),
  ego: ZNcEntity,
});

export type SessionWithNetworkEgo = z.infer<typeof ZSessionWithNetworkEgo>;

export type SessionsByProtocol = Record<string, SessionWithNetworkEgo[]>;
