import {
  type caseProperty,
  type codebookHashProperty,
  type edgeExportIDProperty,
  egoProperty,
  type ncSourceUUID,
  type ncTargetUUID,
  type nodeExportIDProperty,
  type protocolName,
  type protocolProperty,
  type sessionExportTimeProperty,
  type sessionFinishTimeProperty,
  type sessionProperty,
  type sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { z } from 'zod';
import {
  type NcNetwork,
  ZNcEdge,
  type ZNcNode,
} from '~/schemas/network-canvas';

type NodeWithEgo = z.infer<typeof ZNcNode> & {
  [egoProperty]: string;
};

const EdgeWithEgo = ZNcEdge.extend({
  [egoProperty]: z.string(),
});

type EdgeWithEgo = z.infer<typeof ZNcEdge> & {
  [egoProperty]: string;
};

export type SessionsByProtocol = Record<string, SessionWithNetworkEgo[]>;

export type SessionVariables = {
  [caseProperty]: string;
  [sessionProperty]: string;
  [protocolProperty]: string;
  [protocolName]: string;
  [codebookHashProperty]: string;
  [sessionExportTimeProperty]: string;
  [sessionStartTimeProperty]: string | undefined;
  [sessionFinishTimeProperty]: string | undefined;
  COMMIT_HASH: string;
  APP_VERSION: string;
};

export type FormattedSession = NcNetwork & {
  sessionVariables: SessionVariables;
};

export type SessionWithNetworkEgo = Omit<
  FormattedSession,
  'nodes' | 'edges'
> & {
  nodes: NodeWithEgo[];
  edges: EdgeWithEgo[];
};

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

export type ExportFormat =
  | 'graphml'
  | 'attributeList'
  | 'edgeList'
  | 'ego'
  | 'adjacencyMatrix';

type ExportError = {
  success: false;
  error: Error;
};

type ExportSuccess = {
  success: true;
  filePath: string;
};

export type ExportResult = ExportError | ExportSuccess;

export type ExportReturn = {
  zipUrl?: string;
  zipKey?: string;
  status: 'success' | 'error' | 'cancelled' | 'partial';
  error: string | null;
  successfulExports?: ExportResult[];
  failedExports?: ExportResult[];
};

export type NodeWithResequencedID = NodeWithEgo & {
  [nodeExportIDProperty]: number;
};

export type EdgeWithResequencedID = EdgeWithEgo & {
  [ncSourceUUID]: string;
  [ncTargetUUID]: string;
  [edgeExportIDProperty]: number;
};

export type SessionWithResequencedIDs = Omit<
  FormattedSession,
  'nodes' | 'edges'
> & {
  nodes: NodeWithResequencedID[];
  edges: EdgeWithResequencedID[];
};

export type ArchiveResult = {
  path: string;
  completed: ExportResult[];
  rejected: ExportResult[];
};
