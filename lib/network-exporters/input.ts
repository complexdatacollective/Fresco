import type { Codebook } from '@codaco/protocol-validation';
import { NcNetworkSchema } from '@codaco/shared-consts';
import type {
  caseProperty,
  codebookHashProperty,
  edgeExportIDProperty,
  egoProperty,
  NcEdge,
  NcNetwork,
  NcNode,
  ncSourceUUID,
  ncTargetUUID,
  nodeExportIDProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';

type NodeWithEgo = NcNode & {
  [egoProperty]: string;
};

type EdgeWithEgo = NcEdge & {
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

export type ProtocolExportInput = {
  hash: string;
  name: string;
  codebook: Codebook;
};

export type InterviewExportInput = {
  id: string;
  participantIdentifier: string;
  startTime: Date;
  finishTime: Date | null;
  network: NcNetwork;
  protocol: ProtocolExportInput;
};

export const parseNcNetwork = (raw: unknown): NcNetwork => {
  return NcNetworkSchema.parse(raw);
};
