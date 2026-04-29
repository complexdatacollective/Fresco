import {
  type AuxiliaryConnector,
  type DuplicateArc,
  type LineSegment,
  type ParentChildConnector,
  type ParentConnection,
  type ParentEdgeType,
  type ParentGroupConnector,
  type PedigreeConnectors,
  type PedigreeLayout,
  type Point,
  type ScalingParams,
  type TwinIndicator,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

const AUXILIARY_EDGE_TYPES = new Set<ParentEdgeType>(['donor', 'surrogate']);

function isPrimaryEdge(edgeType: ParentEdgeType): boolean {
  return !AUXILIARY_EDGE_TYPES.has(edgeType);
}

/**
 * Compute connector geometry for rendering a pedigree.
 *
 * Produces abstract line segments and paths — no SVG or canvas dependency.
 *
 * @param layout - pedigree layout (positions, families, groups, twins)
 * @param scaling - box sizing and scale factors
 * @param parents - parent connections for edge type info
 * @param activePartnerPairs - set of "min,max" keys for active partner pairs.
 *   Inactive pairs are drawn with a relationship break mark. When omitted, all
 *   group lines are treated as active (backwards-compatible default).
 * @param branch - branch style for parent-child links (0=diagonal, >0=right-angle). Default 0.6
 * @param pconnect - where parent link meets sibling bar (0-1). Default 0.5
 */
export function computeConnectors(
  layout: PedigreeLayout,
  scaling: ScalingParams,
  parents: ParentConnection[][],
  activePartnerPairs?: Set<string>,
  branch = 0.6,
  pconnect = 0.5,
  nodeNames?: string[],
): PedigreeConnectors {
  const { boxHeight: boxh, legHeight: legh } = scaling;
  const maxlev = layout.nid.length;
  const maxcol = Math.max(...layout.n, 0);

  const groupLines: ParentGroupConnector[] = [];
  const groupLineIndex = new Map<string, number>();
  const parentChildLines: ParentChildConnector[] = [];
  const auxiliaryLines: AuxiliaryConnector[] = [];
  const twinIndicators: TwinIndicator[] = [];
  const duplicateArcs: DuplicateArc[] = [];
  // Maps "childLevel,famId" → sibling bar segment (populated during parent-child computation)
  const familySiblingBar = new Map<string, LineSegment>();

  // --- Parent group lines (all partner pairs, marked active/inactive) ---
  for (let i = 0; i < maxlev; i++) {
    const tempy = i + boxh / 2;
    for (let j = 0; j < maxcol; j++) {
      if (layout.group[i]?.[j] && layout.group[i]![j]! > 0) {
        let isActive = true;
        if (activePartnerPairs) {
          const leftId = layout.nid[i]![j]!;
          const rightId = layout.nid[i]![j + 1]!;
          const pairKey = `${Math.min(leftId, rightId)},${Math.max(leftId, rightId)}`;
          isActive = activePartnerPairs.has(pairKey);
        }

        const x1 = layout.pos[i]![j]!;
        const x2 = layout.pos[i]![j + 1]!;
        const segment: LineSegment = {
          type: 'line',
          x1,
          y1: tempy,
          x2,
          y2: tempy,
        };

        const isDouble = layout.group[i]![j] === 2;

        const connector: ParentGroupConnector = {
          type: 'parent-group',
          segment,
          double: isDouble,
          isActive,
        };

        // For inactive lines, determine which side to place the slash:
        if (!isActive) {
          if (nodeNames) {
            const rightId = layout.nid[i]![j + 1]!;
            const rightName = nodeNames[rightId] ?? '';
            connector.slashSide = rightName.length === 0 ? 'right' : 'left';
          } else {
            connector.slashSide = 'left';
          }
        }

        if (isDouble) {
          connector.doubleSegment = {
            type: 'line',
            x1,
            y1: tempy + boxh / 10,
            x2,
            y2: tempy + boxh / 10,
          };
        }

        groupLineIndex.set(`${i},${j}`, groupLines.length);
        groupLines.push(connector);
      }
    }
  }

  // --- Parent-child lines ---
  for (let i = 1; i < maxlev; i++) {
    const familyIds = [...new Set(layout.fam[i]!.filter((v) => v > 0))];

    for (const fam of familyIds) {
      const coupleLeft = fam - 1;
      const parentLevelN = layout.n[i - 1] ?? 0;
      const hasPartnerRight =
        coupleLeft + 1 < parentLevelN &&
        (layout.group[i - 1]?.[coupleLeft] ?? 0) > 0;
      const coupleRight = hasPartnerRight ? coupleLeft + 1 : coupleLeft;

      // Determine descent point: genetic contributor or couple midpoint
      const descentX = computeDescentX(
        layout,
        parents,
        i,
        coupleLeft,
        coupleRight,
      );

      const glKey = `${i - 1},${coupleLeft}`;
      const glIdx = groupLineIndex.get(glKey);
      if (glIdx !== undefined) {
        const gl = groupLines[glIdx]!;
        gl.descentXPositions ??= [];
        gl.descentXPositions.push(descentX);
      }

      const whoIdx: number[] = [];
      const marriedInIdx: number[] = [];
      for (let j = 0; j < layout.fam[i]!.length; j++) {
        if (layout.fam[i]![j] !== fam) continue;
        if (layout.groupMember[i]?.[j]) {
          marriedInIdx.push(j);
        } else {
          whoIdx.push(j);
        }
      }

      const firstIdx = whoIdx[0] ?? marriedInIdx[0]!;
      const firstChildId = layout.nid[i]![firstIdx]!;
      const childParents = parents[firstChildId] ?? [];

      // Determine the edge type for the primary couple→child connector.
      // Only consider edges from parents in this couple, and prefer
      // biological over social so the connector style is deterministic.
      const coupleLeftId = layout.nid[i - 1]![coupleLeft]!;
      const coupleRightId =
        coupleLeft !== coupleRight
          ? layout.nid[i - 1]![coupleRight]!
          : coupleLeftId;
      const coupleEdges = childParents.filter(
        (p) =>
          p.parentIndex === coupleLeftId || p.parentIndex === coupleRightId,
      );
      const primaryEdgeType: ParentEdgeType =
        coupleEdges.find((p) => p.edgeType === 'biological')?.edgeType ??
        coupleEdges.find((p) => isPrimaryEdge(p.edgeType))?.edgeType ??
        'biological';

      if (whoIdx.length === 0) {
        for (const j of marriedInIdx) {
          const childX = layout.pos[i]![j]!;
          const upline: LineSegment = {
            type: 'line',
            x1: childX,
            y1: i + boxh / 2,
            x2: childX,
            y2: i - legh,
          };
          const bar: LineSegment = {
            type: 'line',
            x1: childX,
            y1: i - legh,
            x2: childX,
            y2: i - legh,
          };
          const link = buildParentLink(childX, descentX, i, boxh, legh, branch);
          parentChildLines.push({
            type: 'parent-child',
            edgeType: primaryEdgeType,
            uplines: [upline],
            siblingBar: bar,
            parentLink: link,
          });
        }
        continue;
      }

      // Compute targets (twin grouping)
      let target: number[];
      if (!layout.twins) {
        target = whoIdx.map((j) => layout.pos[i]![j]!);
      } else {
        const twinToLeft: number[] = [0];
        for (let k = 1; k < whoIdx.length; k++) {
          twinToLeft.push(layout.twins[i]?.[whoIdx[k]!] ?? 0);
        }
        const groups: number[] = [];
        let groupId = 0;
        for (const ttl of twinToLeft) {
          if (ttl === 0) groupId++;
          groups.push(groupId);
        }

        const groupMeans = new Map<number, number[]>();
        for (let k = 0; k < groups.length; k++) {
          const g = groups[k]!;
          if (!groupMeans.has(g)) groupMeans.set(g, []);
          groupMeans.get(g)!.push(layout.pos[i]![whoIdx[k]!]!);
        }
        const meanMap = new Map<number, number>();
        for (const [g, positions] of groupMeans) {
          meanMap.set(
            g,
            positions.reduce((a, b) => a + b, 0) / positions.length,
          );
        }

        target = groups.map((g) => meanMap.get(g)!);
      }

      // Uplines: from each child to sibling bar
      const uplines: LineSegment[] = [];
      for (let k = 0; k < whoIdx.length; k++) {
        const childX = layout.pos[i]![whoIdx[k]!]!;
        uplines.push({
          type: 'line',
          x1: childX,
          y1: i + boxh / 2,
          x2: target[k]!,
          y2: i - legh,
        });
      }

      // Twin indicators
      if (layout.twins) {
        for (let k = 0; k < whoIdx.length; k++) {
          if (layout.twins[i]?.[whoIdx[k]!] === 1) {
            const temp1 = (layout.pos[i]![whoIdx[k]!]! + target[k]!) / 2;
            const temp2 = (layout.pos[i]![whoIdx[k + 1]!]! + target[k]!) / 2;
            twinIndicators.push({
              type: 'twin',
              code: 1,
              segment: {
                type: 'line',
                x1: temp1,
                y1: i - legh / 2,
                x2: temp2,
                y2: i - legh / 2,
              },
            });
          }

          if (layout.twins[i]?.[whoIdx[k]!] === 3) {
            const temp1 = (layout.pos[i]![whoIdx[k]!]! + target[k]!) / 2;
            const temp2 = (layout.pos[i]![whoIdx[k + 1]!]! + target[k]!) / 2;
            twinIndicators.push({
              type: 'twin',
              code: 3,
              label: { x: (temp1 + temp2) / 2, y: i - legh / 2 },
            });
          }

          if (layout.twins[i]?.[whoIdx[k]!] === 2) {
            twinIndicators.push({
              type: 'twin',
              code: 2,
            });
          }
        }
      }

      // Sibling bar
      const minTarget = Math.min(...target);
      const maxTarget = Math.max(...target);
      const siblingBar: LineSegment = {
        type: 'line',
        x1: minTarget,
        y1: i - legh,
        x2: maxTarget,
        y2: i - legh,
      };

      familySiblingBar.set(`${i},${fam}`, siblingBar);

      // Parent link
      const targetRange = maxTarget - minTarget;
      let x1: number;
      if (targetRange < 2 * pconnect) {
        x1 = (minTarget + maxTarget) / 2;
      } else {
        x1 = Math.max(
          minTarget + pconnect,
          Math.min(maxTarget - pconnect, descentX),
        );
      }

      const y1 = i - legh;
      const parentLink: LineSegment[] = [];

      const parentCenterY = i - 1 + boxh / 2;
      const parentBottomY = i - 1 + boxh;

      const x2 = descentX;

      if (branch === 0) {
        parentLink.push(
          {
            type: 'line',
            x1: x2,
            y1: parentCenterY,
            x2,
            y2: parentBottomY,
          },
          {
            type: 'line',
            x1: x2,
            y1: parentBottomY,
            x2: x1,
            y2: y1,
          },
        );
      } else {
        const gapSpan = y1 - parentBottomY;
        const ydelta = (gapSpan * branch) / 2;
        parentLink.push(
          {
            type: 'line',
            x1: x2,
            y1: parentCenterY,
            x2,
            y2: parentBottomY,
          },
          {
            type: 'line',
            x1: x2,
            y1: parentBottomY,
            x2,
            y2: parentBottomY + ydelta,
          },
          {
            type: 'line',
            x1: x2,
            y1: parentBottomY + ydelta,
            x2: x1,
            y2: y1 - ydelta,
          },
          { type: 'line', x1, y1: y1 - ydelta, x2: x1, y2: y1 },
        );
      }

      parentChildLines.push({
        type: 'parent-child',
        edgeType: primaryEdgeType,
        uplines,
        siblingBar,
        parentLink,
      });

      // Render individual connectors for married-in group members
      for (const j of marriedInIdx) {
        const childX = layout.pos[i]![j]!;
        const miUpline: LineSegment = {
          type: 'line',
          x1: childX,
          y1: i + boxh / 2,
          x2: childX,
          y2: i - legh,
        };
        const miBar: LineSegment = {
          type: 'line',
          x1: childX,
          y1: i - legh,
          x2: childX,
          y2: i - legh,
        };
        const miLink = buildParentLink(childX, descentX, i, boxh, legh, branch);
        parentChildLines.push({
          type: 'parent-child',
          edgeType: primaryEdgeType,
          uplines: [miUpline],
          siblingBar: miBar,
          parentLink: miLink,
        });
      }
    }
  }

  // --- Auxiliary lines for donor/surrogate edges ---
  // Group connections by (parentIndex, childLevel, famId), tracking which
  // specific children each auxiliary parent connects to.
  const auxConnections = new Map<
    string,
    {
      parentIndex: number;
      edgeType: 'donor' | 'surrogate';
      childLevel: number;
      famId: number;
      childColumns: number[];
    }
  >();

  // Count total children per (level, famId) to compare against.
  const familyChildCount = new Map<string, number>();

  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const childId = layout.nid[i]![j]!;
      if (childId < 0) continue;
      const famId = layout.fam[i]?.[j] ?? 0;
      if (famId <= 0) continue;

      const famKey = `${i},${famId}`;
      familyChildCount.set(famKey, (familyChildCount.get(famKey) ?? 0) + 1);

      const childParents = parents[childId] ?? [];
      for (const pc of childParents) {
        if (pc.edgeType === 'donor' || pc.edgeType === 'surrogate') {
          const key = `${pc.parentIndex},${i},${famId}`;
          const existing = auxConnections.get(key);
          if (existing) {
            existing.childColumns.push(j);
          } else {
            auxConnections.set(key, {
              parentIndex: pc.parentIndex,
              edgeType: pc.edgeType,
              childLevel: i,
              famId,
              childColumns: [j],
            });
          }
        }
      }
    }
  }

  for (const conn of auxConnections.values()) {
    let parentX: number | undefined;
    let parentY: number | undefined;
    for (let pi = 0; pi < maxlev; pi++) {
      for (let pj = 0; pj < (layout.n[pi] ?? 0); pj++) {
        if (layout.nid[pi]![pj] === conn.parentIndex) {
          parentX = layout.pos[pi]![pj]!;
          parentY = pi + boxh / 2;
          break;
        }
      }
      if (parentX !== undefined) break;
    }
    if (parentX === undefined || parentY === undefined) continue;

    const bar = familySiblingBar.get(`${conn.childLevel},${conn.famId}`);
    const famKey = `${conn.childLevel},${conn.famId}`;
    const totalChildren = familyChildCount.get(famKey) ?? 0;
    const isParentOfAllSiblings = conn.childColumns.length >= totalChildren;

    if (bar && isParentOfAllSiblings && totalChildren > 1) {
      // Parent of all siblings — connect to the sibling bar
      const barMinX = Math.min(bar.x1, bar.x2);
      const barMaxX = Math.max(bar.x1, bar.x2);
      const connectX = Math.max(barMinX, Math.min(parentX, barMaxX));

      auxiliaryLines.push({
        type: 'auxiliary',
        edgeType: conn.edgeType,
        segment: {
          type: 'line',
          x1: parentX,
          y1: parentY,
          x2: connectX,
          y2: bar.y1,
        },
      });
    } else {
      // Parent of only some children (or no sibling bar) — connect
      // directly to each child node
      for (const col of conn.childColumns) {
        auxiliaryLines.push({
          type: 'auxiliary',
          edgeType: conn.edgeType,
          segment: {
            type: 'line',
            x1: parentX,
            y1: parentY,
            x2: layout.pos[conn.childLevel]![col]!,
            y2: conn.childLevel + boxh / 2,
          },
        });
      }
    }
  }

  // --- Auxiliary lines for unpartnered parents ---
  let partnerPairSet: Set<string>;
  if (activePartnerPairs) {
    partnerPairSet = activePartnerPairs;
  } else {
    partnerPairSet = new Set<string>();
    for (let i = 0; i < maxlev; i++) {
      for (let j = 0; j < maxcol; j++) {
        if ((layout.group[i]?.[j] ?? 0) > 0) {
          const leftId = layout.nid[i]![j]!;
          const rightId = layout.nid[i]![j + 1]!;
          partnerPairSet.add(
            `${Math.min(leftId, rightId)},${Math.max(leftId, rightId)}`,
          );
        }
      }
    }
  }

  const nodePosition = new Map<number, { x: number; y: number }>();
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const nid = layout.nid[i]![j]!;
      if (!nodePosition.has(nid)) {
        nodePosition.set(nid, { x: layout.pos[i]![j]!, y: i });
      }
    }
  }

  // Group social/unpartnered-parent connections by (parentIndex, childLevel,
  // famId) so we can decide per-parent whether to connect to the sibling bar
  // or directly to individual children.
  const socialConnections = new Map<
    string,
    {
      parentIndex: number;
      edgeType: 'social' | 'unpartnered-parent' | 'biological';
      childLevel: number;
      famId: number;
      childColumns: number[];
    }
  >();

  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const childId = layout.nid[i]![j]!;
      const childParents = parents[childId] ?? [];

      const parentEdges = childParents.filter((pc) =>
        isPrimaryEdge(pc.edgeType),
      );
      if (parentEdges.length < 2) continue;

      const parentIds = parentEdges.map((pe) => pe.parentIndex);
      const partneredParents = new Set<number>();

      for (let a = 0; a < parentIds.length; a++) {
        for (let b = a + 1; b < parentIds.length; b++) {
          const key = `${Math.min(parentIds[a]!, parentIds[b]!)},${Math.max(parentIds[a]!, parentIds[b]!)}`;
          if (partnerPairSet.has(key)) {
            partneredParents.add(parentIds[a]!);
            partneredParents.add(parentIds[b]!);
          }
        }
      }

      if (partneredParents.size === 0) continue;

      // Determine which parent pair the child is assigned to (primary family)
      const childFam = layout.fam[i]?.[j] ?? 0;
      const primaryCoupleLeft = childFam > 0 ? childFam - 1 : -1;
      const primaryParentLevelN = layout.n[i - 1] ?? 0;
      const primaryHasRight =
        primaryCoupleLeft >= 0 &&
        primaryCoupleLeft + 1 < primaryParentLevelN &&
        (layout.group[i - 1]?.[primaryCoupleLeft] ?? 0) > 0;
      const primaryLeftId =
        primaryCoupleLeft >= 0
          ? layout.nid[i - 1]?.[primaryCoupleLeft]
          : undefined;
      const primaryRightId = primaryHasRight
        ? layout.nid[i - 1]?.[primaryCoupleLeft + 1]
        : undefined;
      const primaryFamilyIds = new Set<number>();
      if (primaryLeftId !== undefined) primaryFamilyIds.add(primaryLeftId);
      if (primaryRightId !== undefined) primaryFamilyIds.add(primaryRightId);

      const famId = layout.fam[i]?.[j] ?? 0;

      for (const parentId of parentIds) {
        if (primaryFamilyIds.has(parentId)) continue;

        const parentEdge = childParents.find(
          (pc) => pc.parentIndex === parentId,
        );

        // Preserve the actual edge type so biological unpartnered parents
        // get a solid line.
        const edgeType: 'social' | 'unpartnered-parent' | 'biological' =
          parentEdge?.edgeType === 'social'
            ? 'social'
            : parentEdge?.edgeType === 'biological'
              ? 'biological'
              : 'unpartnered-parent';

        const key = `${parentId},${i},${famId}`;
        const existing = socialConnections.get(key);
        if (existing) {
          existing.childColumns.push(j);
        } else {
          socialConnections.set(key, {
            parentIndex: parentId,
            edgeType,
            childLevel: i,
            famId,
            childColumns: [j],
          });
        }
      }
    }
  }

  for (const conn of socialConnections.values()) {
    const parentPos = nodePosition.get(conn.parentIndex);
    if (!parentPos) continue;

    const bar = familySiblingBar.get(`${conn.childLevel},${conn.famId}`);
    const famKey = `${conn.childLevel},${conn.famId}`;
    const totalChildren = familyChildCount.get(famKey) ?? 0;
    const isParentOfAllSiblings = conn.childColumns.length >= totalChildren;

    if (bar && isParentOfAllSiblings && totalChildren > 1) {
      const barMinX = Math.min(bar.x1, bar.x2);
      const barMaxX = Math.max(bar.x1, bar.x2);
      const connectX = Math.max(barMinX, Math.min(parentPos.x, barMaxX));

      auxiliaryLines.push({
        type: 'auxiliary',
        edgeType: conn.edgeType,
        segment: {
          type: 'line',
          x1: parentPos.x,
          y1: parentPos.y + boxh / 2,
          x2: connectX,
          y2: bar.y1,
        },
      });
    } else {
      for (const col of conn.childColumns) {
        auxiliaryLines.push({
          type: 'auxiliary',
          edgeType: conn.edgeType,
          segment: {
            type: 'line',
            x1: parentPos.x,
            y1: parentPos.y + boxh / 2,
            x2: layout.pos[conn.childLevel]![col]!,
            y2: conn.childLevel + boxh / 2,
          },
        });
      }
    }
  }

  // --- Duplicate subject arcs ---
  const allIds = new Set<number>();
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const nid = layout.nid[i]![j]!;
      allIds.add(nid);
    }
  }

  for (const id of allIds) {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < maxlev; i++) {
      for (let j = 0; j < (layout.n[i] ?? 0); j++) {
        if (layout.nid[i]![j] === id) {
          positions.push({ x: layout.pos[i]![j]!, y: i });
        }
      }
    }

    if (positions.length > 1) {
      positions.sort((a, b) => a.x - b.x);

      for (let j = 0; j < positions.length - 1; j++) {
        const p1 = positions[j]!;
        const p2 = positions[j + 1]!;

        const points: Point[] = [];
        for (let k = 0; k < 15; k++) {
          const t = k / 14;
          const xx = p1.x + t * (p2.x - p1.x);
          const seq = -7 + k;
          const yy = p1.y + t * (p2.y - p1.y) + (seq * seq) / 98 - 0.5;
          points.push({ x: xx, y: yy });
        }

        duplicateArcs.push({
          type: 'duplicate-arc',
          path: { type: 'arc', points, dashed: true },
          personIndex: id,
        });
      }
    }
  }

  return {
    groupLines,
    parentChildLines,
    auxiliaryLines,
    twinIndicators,
    duplicateArcs,
  };
}

/**
 * Determine the x-coordinate for the line of descent from parents to children.
 *
 * When both parents in the couple have biological edges to the children,
 * descent is from the couple midpoint. When only one parent is a genetic
 * contributor (biological edge), descent is from that parent's node position.
 */
function computeDescentX(
  layout: PedigreeLayout,
  parents: ParentConnection[][],
  childLevel: number,
  coupleLeft: number,
  coupleRight: number,
): number {
  const leftPos = layout.pos[childLevel - 1]![coupleLeft]!;
  const rightPos = layout.pos[childLevel - 1]![coupleRight]!;

  if (coupleLeft === coupleRight) {
    return leftPos;
  }

  const leftId = layout.nid[childLevel - 1]![coupleLeft]!;
  const rightId = layout.nid[childLevel - 1]![coupleRight]!;

  // Check children in this family for their parent edge types
  const famId = coupleLeft + 1;
  let leftIsBiological = false;
  let rightIsBiological = false;

  for (let j = 0; j < layout.fam[childLevel]!.length; j++) {
    if (layout.fam[childLevel]![j] !== famId) continue;
    const childId = layout.nid[childLevel]![j]!;
    const childParents = parents[childId] ?? [];

    for (const pc of childParents) {
      if (pc.parentIndex === leftId && pc.edgeType === 'biological') {
        leftIsBiological = true;
      }
      if (pc.parentIndex === rightId && pc.edgeType === 'biological') {
        rightIsBiological = true;
      }
    }
  }

  if (leftIsBiological && !rightIsBiological) {
    return leftPos;
  }
  if (rightIsBiological && !leftIsBiological) {
    return rightPos;
  }

  return (leftPos + rightPos) / 2;
}

function buildParentLink(
  childX: number,
  parentx: number,
  i: number,
  boxh: number,
  legh: number,
  branch: number,
): LineSegment[] {
  const y1 = i - legh;
  const parentCenterY = i - 1 + boxh / 2;
  const parentBottomY = i - 1 + boxh;
  const link: LineSegment[] = [];

  if (branch === 0) {
    link.push(
      {
        type: 'line',
        x1: parentx,
        y1: parentCenterY,
        x2: parentx,
        y2: parentBottomY,
      },
      {
        type: 'line',
        x1: parentx,
        y1: parentBottomY,
        x2: childX,
        y2: y1,
      },
    );
  } else {
    const gapSpan = y1 - parentBottomY;
    const ydelta = (gapSpan * branch) / 2;
    link.push(
      {
        type: 'line',
        x1: parentx,
        y1: parentCenterY,
        x2: parentx,
        y2: parentBottomY,
      },
      {
        type: 'line',
        x1: parentx,
        y1: parentBottomY,
        x2: parentx,
        y2: parentBottomY + ydelta,
      },
      {
        type: 'line',
        x1: parentx,
        y1: parentBottomY + ydelta,
        x2: childX,
        y2: y1 - ydelta,
      },
      { type: 'line', x1: childX, y1: y1 - ydelta, x2: childX, y2: y1 },
    );
  }

  return link;
}
