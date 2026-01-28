import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/config';
import { type Edge } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import {
  type PedigreeConnectors,
  type PedigreeInput,
  type PedigreeLayout,
  type Relation,
  type ScalingParams,
  type Sex,
} from '~/lib/pedigree-layout/types';

export type ConnectorRenderData = {
  connectors: PedigreeConnectors;
  exPartnerPairs: Set<string>;
};

type ConversionResult = {
  input: PedigreeInput;
  indexToId: string[];
  idToIndex: Map<string, number>;
};

function mapSex(sex: 'male' | 'female' | undefined): Sex {
  if (sex === 'male') return 'male';
  if (sex === 'female') return 'female';
  return 'unknown';
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function storeToPedigreeInput(
  nodes: Map<string, Omit<FamilyTreeNodeType, 'id'>>,
  edges: Map<string, Omit<Edge, 'id'>>,
): ConversionResult {
  const indexToId: string[] = [];
  const idToIndex = new Map<string, number>();

  let idx = 0;
  for (const nodeId of nodes.keys()) {
    indexToId.push(nodeId);
    idToIndex.set(nodeId, idx);
    idx++;
  }

  const n = indexToId.length;
  const id: string[] = indexToId.slice();
  const sex: Sex[] = indexToId.map((nid) => mapSex(nodes.get(nid)?.sex));
  const fatherIndex: number[] = new Array<number>(n).fill(-1);
  const motherIndex: number[] = new Array<number>(n).fill(-1);
  const relations: Relation[] = [];

  // Build parent indices
  for (const edge of edges.values()) {
    if (edge.relationship !== 'parent') continue;
    const childIdx = idToIndex.get(edge.target);
    const parentIdx = idToIndex.get(edge.source);
    if (childIdx === undefined || parentIdx === undefined) continue;

    const parentNode = nodes.get(edge.source);
    if (parentNode?.sex === 'male') {
      fatherIndex[childIdx] = parentIdx;
    } else {
      motherIndex[childIdx] = parentIdx;
    }
  }

  // Enforce 0-or-2 parent constraint: if only one parent is set, clear both
  for (let i = 0; i < n; i++) {
    if ((fatherIndex[i] === -1) !== (motherIndex[i] === -1)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Node "${indexToId[i]}" has only one parent — treating as founder`,
      );
      fatherIndex[i] = -1;
      motherIndex[i] = -1;
    }
  }

  // Build relations from partner/ex-partner edges (code 4 = spouse)
  for (const edge of edges.values()) {
    if (edge.relationship !== 'partner' && edge.relationship !== 'ex-partner')
      continue;
    const i1 = idToIndex.get(edge.source);
    const i2 = idToIndex.get(edge.target);
    if (i1 === undefined || i2 === undefined) continue;
    relations.push({ id1: i1, id2: i2, code: 4 });
  }

  return {
    input: {
      id,
      fatherIndex,
      motherIndex,
      sex,
      relation: relations.length > 0 ? relations : undefined,
    },
    indexToId,
    idToIndex,
  };
}

export function pedigreeLayoutToPositions(
  layout: PedigreeLayout,
  indexToId: string[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  for (let gen = 0; gen < layout.nid.length; gen++) {
    const genN = layout.n[gen] ?? 0;
    for (let col = 0; col < genN; col++) {
      const personIdx = layout.nid[gen]![col]!;
      if (personIdx < 0) continue;
      const nodeId = indexToId[personIdx];
      if (nodeId === undefined) continue;
      // Only record first appearance (skip duplicates)
      if (positions.has(nodeId)) continue;

      const x = layout.pos[gen]![col]! * FAMILY_TREE_CONFIG.siblingSpacing;
      const y = gen * FAMILY_TREE_CONFIG.rowHeight;
      positions.set(nodeId, { x, y });
    }
  }

  // Normalize so min x = 0 and min y = 0
  let minX = Infinity;
  let minY = Infinity;
  for (const pos of positions.values()) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
  }
  if (Number.isFinite(minX) && minX !== 0) {
    for (const pos of positions.values()) {
      pos.x -= minX;
    }
  }
  if (Number.isFinite(minY) && minY !== 0) {
    for (const pos of positions.values()) {
      pos.y -= minY;
    }
  }

  return positions;
}

export function buildConnectorData(
  layout: PedigreeLayout,
  edges: Map<string, Omit<Edge, 'id'>>,
): ConnectorRenderData {
  const scaling: ScalingParams = {
    boxWidth: FAMILY_TREE_CONFIG.nodeWidth / FAMILY_TREE_CONFIG.siblingSpacing,
    boxHeight: FAMILY_TREE_CONFIG.nodeHeight / FAMILY_TREE_CONFIG.rowHeight,
    legHeight: 0.25,
    hScale: 1,
    vScale: 1,
  };

  const connectors = computeConnectors(layout, scaling);

  // Transform all coordinates to pixel space
  const sx = FAMILY_TREE_CONFIG.siblingSpacing;
  const sy = FAMILY_TREE_CONFIG.rowHeight;
  const xOffset = FAMILY_TREE_CONFIG.nodeContainerWidth / 2;

  for (const sp of connectors.spouseLines) {
    transformSegment(sp.segment, sx, sy, xOffset);
    if (sp.doubleSegment) {
      transformSegment(sp.doubleSegment, sx, sy, xOffset);
    }
  }

  for (const pc of connectors.parentChildLines) {
    for (const ul of pc.uplines) {
      transformSegment(ul, sx, sy, xOffset);
    }
    transformSegment(pc.siblingBar, sx, sy, xOffset);
    for (const pl of pc.parentLink) {
      transformSegment(pl, sx, sy, xOffset);
    }
  }

  for (const ti of connectors.twinIndicators) {
    if (ti.segment) {
      transformSegment(ti.segment, sx, sy, xOffset);
    }
    if (ti.label) {
      ti.label.x = ti.label.x * sx + xOffset;
      ti.label.y = ti.label.y * sy;
    }
  }

  for (const da of connectors.duplicateArcs) {
    for (const pt of da.path.points) {
      pt.x = pt.x * sx + xOffset;
      pt.y = pt.y * sy;
    }
  }

  // Also apply the same min-x normalization that pedigreeLayoutToPositions does
  let minX = Infinity;
  for (let gen = 0; gen < layout.nid.length; gen++) {
    const genN = layout.n[gen] ?? 0;
    for (let col = 0; col < genN; col++) {
      const personIdx = layout.nid[gen]![col]!;
      if (personIdx < 0) continue;
      const x = layout.pos[gen]![col]! * sx + xOffset;
      if (x < minX) minX = x;
    }
  }

  // The positions function normalizes by subtracting minX from (pos * sx),
  // and we added xOffset; so our shift = minX - xOffset
  // Actually the positions normalize the raw (pos*sx), so we need the
  // raw min: rawMinX = minRawPos * sx, then positions subtract rawMinX.
  // Our connector coords are (connectorAbstract * sx + xOffset).
  // The positions are (pos * sx - rawMinX). Nodes are rendered at
  // (pos.x, pos.y) with nodeContainerWidth centering the visual node.
  // So connector x should align with node center = pos.x + xOffset.
  // connector.x = abstractX * sx + xOffset
  // node center  = (rawPos * sx - rawMinX) + xOffset
  // So shift connectors by -rawMinX to match.
  let rawMinX = Infinity;
  for (let gen = 0; gen < layout.nid.length; gen++) {
    const genN = layout.n[gen] ?? 0;
    for (let col = 0; col < genN; col++) {
      const personIdx = layout.nid[gen]![col]!;
      if (personIdx < 0) continue;
      const rawX = layout.pos[gen]![col]! * sx;
      if (rawX < rawMinX) rawMinX = rawX;
    }
  }

  if (Number.isFinite(rawMinX) && rawMinX !== 0) {
    for (const sp of connectors.spouseLines) {
      shiftSegment(sp.segment, -rawMinX, 0);
      if (sp.doubleSegment) shiftSegment(sp.doubleSegment, -rawMinX, 0);
    }
    for (const pc of connectors.parentChildLines) {
      for (const ul of pc.uplines) shiftSegment(ul, -rawMinX, 0);
      shiftSegment(pc.siblingBar, -rawMinX, 0);
      for (const pl of pc.parentLink) shiftSegment(pl, -rawMinX, 0);
    }
    for (const ti of connectors.twinIndicators) {
      if (ti.segment) shiftSegment(ti.segment, -rawMinX, 0);
      if (ti.label) ti.label.x += -rawMinX;
    }
    for (const da of connectors.duplicateArcs) {
      for (const pt of da.path.points) pt.x += -rawMinX;
    }
  }

  // Find first generation with data to compute rawMinY
  let rawMinY = 0;
  for (let gen = 0; gen < layout.nid.length; gen++) {
    const genN = layout.n[gen] ?? 0;
    if (genN > 0) {
      rawMinY = gen * sy;
      break;
    }
  }

  if (rawMinY !== 0) {
    for (const sp of connectors.spouseLines) {
      shiftSegment(sp.segment, 0, -rawMinY);
      if (sp.doubleSegment) shiftSegment(sp.doubleSegment, 0, -rawMinY);
    }
    for (const pc of connectors.parentChildLines) {
      for (const ul of pc.uplines) shiftSegment(ul, 0, -rawMinY);
      shiftSegment(pc.siblingBar, 0, -rawMinY);
      for (const pl of pc.parentLink) shiftSegment(pl, 0, -rawMinY);
    }
    for (const ti of connectors.twinIndicators) {
      if (ti.segment) shiftSegment(ti.segment, 0, -rawMinY);
      if (ti.label) ti.label.y += -rawMinY;
    }
    for (const da of connectors.duplicateArcs) {
      for (const pt of da.path.points) pt.y += -rawMinY;
    }
  }

  // Build ex-partner pair set
  const exPartnerPairs = new Set<string>();
  for (const edge of edges.values()) {
    if (edge.relationship === 'ex-partner') {
      exPartnerPairs.add(pairKey(edge.source, edge.target));
    }
  }

  return { connectors, exPartnerPairs };
}

function transformSegment(
  seg: { x1: number; y1: number; x2: number; y2: number },
  sx: number,
  sy: number,
  xOffset: number,
) {
  seg.x1 = seg.x1 * sx + xOffset;
  seg.y1 = seg.y1 * sy;
  seg.x2 = seg.x2 * sx + xOffset;
  seg.y2 = seg.y2 * sy;
}

function shiftSegment(
  seg: { x1: number; y1: number; x2: number; y2: number },
  dx: number,
  dy: number,
) {
  seg.x1 += dx;
  seg.x2 += dx;
  seg.y1 += dy;
  seg.y2 += dy;
}
