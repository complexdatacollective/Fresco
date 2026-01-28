export type Sex = 'male' | 'female' | 'unknown' | 'terminated';

export type RelationCode = 1 | 2 | 3 | 4;
// 1=MZ twin, 2=DZ twin, 3=unknown twin, 4=spouse

export type Relation = {
  id1: number; // 0-based index
  id2: number; // 0-based index
  code: RelationCode;
};

export type PedigreeInput = {
  id: string[];
  fatherIndex: number[]; // -1 = no father
  motherIndex: number[]; // -1 = no mother
  sex: Sex[];
  relation?: Relation[];
  hints?: Hints;
};

export type Hints = {
  order: number[];
  spouse?: SpouseHint[];
};

export type SpouseHint = {
  leftIndex: number;
  rightIndex: number;
  anchor: number; // 0=undecided, 1=left anchor, 2=right anchor
};

// Internal spouse list entry (4-column matrix row in R)
// [leftIndex, rightIndex, anchorSide, anchorType]
export type SpouseEntry = [number, number, number, number];

// Internal alignment result passed between alignped functions
export type AlignmentArrays = {
  n: number[]; // count of subjects per generation
  nid: number[][]; // person indices (row=gen, col=pos); .5 = spouse marker
  pos: number[][]; // horizontal positions
  fam: number[][]; // parent family linkage
  spouselist: SpouseEntry[];
};

// Public output from alignPedigree
export type PedigreeLayout = {
  n: number[];
  nid: number[][]; // integer person indices (no .5)
  pos: number[][]; // optimized x-coordinates
  fam: number[][];
  spouse: number[][]; // 0=none, 1=spouse pair, 2=consanguineous
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

export type SpouseConnector = {
  type: 'spouse';
  segment: LineSegment;
  double: boolean;
  doubleSegment?: LineSegment;
};

export type ParentChildConnector = {
  type: 'parent-child';
  uplines: LineSegment[];
  siblingBar: LineSegment;
  parentLink: LineSegment[];
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
  spouseLines: SpouseConnector[];
  parentChildLines: ParentChildConnector[];
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
