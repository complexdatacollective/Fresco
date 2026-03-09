export type Sex = 'male' | 'female' | 'unknown' | 'terminated';

export type Gender =
  | 'man'
  | 'woman'
  | 'non-binary'
  | 'transgender-man'
  | 'transgender-woman'
  | 'genderqueer'
  | 'agender'
  | 'two-spirit'
  | 'other'
  | 'unknown';

export type ParentEdgeType =
  | 'social-parent'
  | 'bio-parent'
  | 'donor'
  | 'surrogate'
  | 'co-parent';

export type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
};

export type RelationCode = 1 | 2 | 3 | 4 | 5 | 6;
// 1=MZ twin, 2=DZ twin, 3=unknown twin, 4=partner
// 5=co-parent, 6=donor/surrogate relation

export type Relation = {
  id1: number; // 0-based index
  id2: number; // 0-based index
  code: RelationCode;
};

export type PedigreeInput = {
  id: string[];
  sex: Sex[];
  gender: Gender[];
  parents: ParentConnection[][]; // parents[i] = all parent connections for person i
  relation?: Relation[];
  hints?: Hints;
};

export type GroupHint = {
  members: number[]; // ordered list of node indices in the group
  anchor: number;
};

export type Hints = {
  order: number[];
  groups?: GroupHint[];
};

// [member indices..., anchorSide, anchorType]
// Variable length — first N-2 elements are member indices
export type GroupEntry = number[];

// Internal alignment result passed between alignped functions
export type AlignmentArrays = {
  n: number[]; // count of subjects per generation
  nid: number[][]; // person indices (row=gen, col=pos); .5 = group member marker
  pos: number[][]; // horizontal positions
  fam: number[][]; // parent family linkage
  grouplist: GroupEntry[];
};

// Public output from alignPedigree
export type PedigreeLayout = {
  n: number[];
  nid: number[][]; // integer person indices (no .5)
  pos: number[][]; // optimized x-coordinates
  fam: number[][];
  group: number[][]; // replaces spouse: 0=none, >0=parent group membership
  twins: number[][] | null; // 0=none, 1=MZ, 2=DZ, 3=unknown
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

export type ArcPath = {
  type: 'arc';
  points: Point[];
  dashed: boolean;
};

export type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  double: boolean; // consanguineous
  doubleSegment?: LineSegment;
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
  edgeType: 'donor' | 'surrogate' | 'bio-parent';
  segments: LineSegment[];
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
