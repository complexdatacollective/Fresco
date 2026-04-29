export type ParentEdgeType =
  | 'biological'
  | 'social'
  | 'donor'
  | 'surrogate'
  | 'adoptive';

export type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
  isGestationalCarrier?: boolean;
};

export type PartnerConnection = {
  partnerIndex1: number;
  partnerIndex2: number;
  isActive: boolean;
};

type RelationCode = 1 | 2 | 3 | 4 | 5 | 6;
// 1=MZ twin, 2=DZ twin, 3=unknown twin, 4=partner
// 5=co-parent, 6=donor/surrogate relation

export type Relation = {
  id1: number; // 0-based index
  id2: number; // 0-based index
  code: RelationCode;
};

export type PedigreeInput = {
  id: string[];
  parents: ParentConnection[][];
  partners?: PartnerConnection[];
  relation?: Relation[];
  hints?: Hints;
};

type GroupHint = {
  members: number[]; // ordered list of node indices in the group
  anchor: number;
};

export type Hints = {
  order: number[];
  groups?: GroupHint[];
};

// Public output from alignPedigree
export type PedigreeLayout = {
  n: number[];
  nid: number[][]; // integer person indices (no .5)
  pos: number[][]; // optimized x-coordinates
  fam: number[][];
  group: number[][]; // replaces spouse: 0=none, >0=parent group membership
  twins: number[][] | null; // 0=none, 1=MZ, 2=DZ, 3=unknown
  // true for nodes that were discovered as group members (.5 encoding),
  // i.e. married-in partners rather than direct descendants
  groupMember: boolean[][];
};

// --- Connector geometry types (for rendering) ---

export type Point = { x: number; y: number };

export type LineSegment = {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type ArcPath = {
  type: 'arc';
  points: Point[];
  dashed: boolean;
};

export type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  double: boolean;
  isActive: boolean;
  doubleSegment?: LineSegment;
  descentXPositions?: number[];
  nodeHalfWidth?: number;
  slashSide?: 'left' | 'right';
};

export type ParentChildConnector = {
  type: 'parent-child';
  edgeType: ParentEdgeType;
  uplines: LineSegment[];
  siblingBar: LineSegment;
  parentLink: LineSegment[];
};

export type AuxiliaryConnector = {
  type: 'auxiliary';
  edgeType:
    | 'donor'
    | 'surrogate'
    | 'unpartnered-parent'
    | 'social'
    | 'adoptive'
    | 'biological';
  segment: LineSegment;
};

export type TwinIndicator = {
  type: 'twin';
  code: 1 | 2 | 3;
  segment?: LineSegment; // MZ: horizontal line between twin uplines
  label?: Point; // unknown: position for "?" label
};

export type DuplicateArc = {
  type: 'duplicate-arc';
  path: ArcPath;
  personIndex: number;
};

export type PedigreeConnectors = {
  groupLines: ParentGroupConnector[];
  parentChildLines: ParentChildConnector[];
  auxiliaryLines: AuxiliaryConnector[];
  twinIndicators: TwinIndicator[];
  duplicateArcs: DuplicateArc[];
};

export type ScalingParams = {
  boxWidth: number;
  boxHeight: number;
  legHeight: number;
  hScale: number;
  vScale: number;
};
