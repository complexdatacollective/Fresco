import { type NcNode, type NcEgo, type NcEdge } from '@codaco/shared-consts';

export type CSVOptions = {
  adjacencyMatrix: boolean;
  attributeList: boolean;
  edgeList: boolean;
  egoAttributeList: boolean;
};

export type GlobalOptions = {
  exportFilename: string;
  unifyNetworks: boolean;
  useDirectedEdges: boolean;
  useScreenLayoutCoordinates: boolean;
  screenLayoutHeight: number;
  screenLayoutWidth: number;
};

export type ExportOptions = {
  exportGraphML: boolean;
  exportCSV: CSVOptions | boolean;
  globalOptions: GlobalOptions;
};

export type ExportFunction = () => Promise<unknown>;

export type SessionVariables = {
  caseId: string;
  sessionId: string;
  protocolUID: string;
  protocolName: string;
  codebookHash: string;
  sessionStart: string;
  sessionExported: string;
};

export type UnifiedSessions = Record<
  string,
  {
    nodes: NcNode[];
    edges: NcEdge[];
    ego?: NcEgo;
    sessionVariables: SessionVariables;
  }[]
>;
