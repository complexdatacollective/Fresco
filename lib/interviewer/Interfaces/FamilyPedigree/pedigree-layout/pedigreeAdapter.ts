import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/layoutDimensions';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { computeConnectors } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/connectors';
import {
  type ParentConnection,
  type ParentEdgeType,
  type PartnerConnection,
  type PedigreeConnectors,
  type PedigreeInput,
  type PedigreeLayout,
  type Relation,
  type ScalingParams,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

export type ConnectorRenderData = {
  connectors: PedigreeConnectors;
};

type ConversionResult = {
  input: PedigreeInput;
  indexToId: string[];
  idToIndex: Map<string, number>;
};

function readEdge(edge: NcEdge, config: VariableConfig) {
  return {
    relationshipType:
      (edge.attributes[config.relationshipTypeVariable] as string) ??
      'biological',
    isActive: edge.attributes[config.isActiveVariable] !== false,
    isGestationalCarrier:
      edge.attributes[config.isGestationalCarrierVariable] === true,
  };
}

export function storeToPedigreeInput(
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
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
  const parents: ParentConnection[][] = Array.from({ length: n }, () => []);
  const relations: Relation[] = [];
  const partnerConnections: PartnerConnection[] = [];

  for (const edge of edges.values()) {
    const { relationshipType, isActive, isGestationalCarrier } = readEdge(
      edge,
      variableConfig,
    );

    if (relationshipType === 'partner') {
      const i1 = idToIndex.get(edge.from);
      const i2 = idToIndex.get(edge.to);
      if (i1 === undefined || i2 === undefined) continue;
      relations.push({ id1: i1, id2: i2, code: 4 });
      partnerConnections.push({
        partnerIndex1: i1,
        partnerIndex2: i2,
        isActive,
      });
    } else {
      const childIdx = idToIndex.get(edge.to);
      const parentIdx = idToIndex.get(edge.from);
      if (childIdx === undefined || parentIdx === undefined) continue;

      parents[childIdx]!.push({
        parentIndex: parentIdx,
        edgeType: relationshipType as ParentEdgeType,
        isGestationalCarrier,
      });
    }
  }

  // Remap biological edges to 'donor' for children with adoptive parents.
  // This makes biological edges auxiliary so the child is positioned under
  // adoptive parents instead, matching standard pedigree conventions.
  for (let i = 0; i < n; i++) {
    const hasAdoptiveParent = parents[i]!.some(
      (p) => p.edgeType === 'adoptive',
    );
    if (!hasAdoptiveParent) continue;
    for (const p of parents[i]!) {
      if (p.edgeType === 'biological') {
        p.edgeType = 'donor';
      }
    }
  }

  return {
    input: {
      id,
      parents,
      partners: partnerConnections.length > 0 ? partnerConnections : undefined,
      relation: relations.length > 0 ? relations : undefined,
    },
    indexToId,
    idToIndex,
  };
}

export function pedigreeLayoutToPositions(
  layout: PedigreeLayout,
  indexToId: string[],
  dimensions: LayoutDimensions,
): Map<string, { x: number; y: number }> {
  const metrics = computeLayoutMetrics(dimensions);
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

      const x = layout.pos[gen]![col]! * metrics.siblingSpacing;
      const y = gen * metrics.rowHeight;
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
  edges: Map<string, NcEdge>,
  dimensions: LayoutDimensions,
  variableConfig: VariableConfig,
  parents: ParentConnection[][] = [],
  idToIndex?: Map<string, number>,
  nodeNames?: string[],
): ConnectorRenderData {
  const metrics = computeLayoutMetrics(dimensions);
  const boxHeight = dimensions.nodeHeight / metrics.rowHeight;
  const scaling: ScalingParams = {
    boxWidth: dimensions.nodeWidth / metrics.siblingSpacing,
    boxHeight,
    legHeight: (1 - boxHeight) / 2,
    hScale: 1,
    vScale: 1,
  };

  // Build set of active partner pairs (numeric index keys)
  let activePartnerPairs: Set<string> | undefined;
  if (idToIndex) {
    activePartnerPairs = new Set<string>();
    for (const edge of edges.values()) {
      const { relationshipType, isActive } = readEdge(edge, variableConfig);
      if (relationshipType !== 'partner' || !isActive) continue;
      const i1 = idToIndex.get(edge.from);
      const i2 = idToIndex.get(edge.to);
      if (i1 === undefined || i2 === undefined) continue;
      activePartnerPairs.add(`${Math.min(i1, i2)},${Math.max(i1, i2)}`);
    }
  }

  const connectors = computeConnectors(
    layout,
    scaling,
    parents,
    activePartnerPairs,
    undefined,
    undefined,
    nodeNames,
  );

  // Transform all coordinates to pixel space
  const sx = metrics.siblingSpacing;
  const sy = metrics.rowHeight;
  const xOffset = metrics.containerWidth / 2;

  for (const sp of connectors.groupLines) {
    transformSegment(sp.segment, sx, sy, xOffset);
    if (sp.doubleSegment) {
      transformSegment(sp.doubleSegment, sx, sy, xOffset);
    }
    if (sp.descentXPositions) {
      for (let k = 0; k < sp.descentXPositions.length; k++) {
        sp.descentXPositions[k] = sp.descentXPositions[k]! * sx + xOffset;
      }
    }
    sp.nodeHalfWidth = metrics.containerWidth / 2;
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

  for (const aux of connectors.auxiliaryLines) {
    for (const seg of [aux.segment]) {
      transformSegment(seg, sx, sy, xOffset);
    }
  }

  for (const da of connectors.duplicateArcs) {
    for (const pt of da.path.points) {
      pt.x = pt.x * sx + xOffset;
      pt.y = pt.y * sy;
    }
  }

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
    for (const sp of connectors.groupLines) {
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
    for (const aux of connectors.auxiliaryLines) {
      for (const seg of [aux.segment]) shiftSegment(seg, -rawMinX, 0);
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
    for (const sp of connectors.groupLines) {
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
    for (const aux of connectors.auxiliaryLines) {
      for (const seg of [aux.segment]) shiftSegment(seg, 0, -rawMinY);
    }
    for (const da of connectors.duplicateArcs) {
      for (const pt of da.path.points) pt.y += -rawMinY;
    }
  }

  return { connectors };
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
