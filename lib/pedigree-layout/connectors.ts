import {
  type AuxiliaryConnector,
  type DuplicateArc,
  type LineSegment,
  type ParentChildConnector,
  type ParentConnection,
  type ParentGroupConnector,
  type PedigreeConnectors,
  type PedigreeLayout,
  type Point,
  type ScalingParams,
  type TwinIndicator,
} from '~/lib/pedigree-layout/types';

/**
 * Compute connector geometry for rendering a pedigree.
 *
 * Produces abstract line segments and paths — no SVG or canvas dependency.
 *
 * @param layout - pedigree layout (positions, families, groups, twins)
 * @param scaling - box sizing and scale factors
 * @param parents - parent connections for edge type info
 * @param activePartnerPairs - set of "min,max" keys for active partner pairs.
 *   Group lines are only drawn between active partners. When omitted, all
 *   group lines are drawn (backwards-compatible default).
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
): PedigreeConnectors {
  const { boxHeight: boxh, legHeight: legh } = scaling;
  const maxlev = layout.nid.length;
  const maxcol = layout.nid[0]?.length ?? 0;

  const groupLines: ParentGroupConnector[] = [];
  const parentChildLines: ParentChildConnector[] = [];
  const auxiliaryLines: AuxiliaryConnector[] = [];
  const twinIndicators: TwinIndicator[] = [];
  const duplicateArcs: DuplicateArc[] = [];

  // --- Parent group lines (only for active partner pairs) ---
  for (let i = 0; i < maxlev; i++) {
    const tempy = i + boxh / 2;
    for (let j = 0; j < maxcol; j++) {
      if (layout.group[i]?.[j] && layout.group[i]![j]! > 0) {
        // Skip group line if the pair is not an active partner pair
        if (activePartnerPairs) {
          const leftId = layout.nid[i]![j]!;
          const rightId = layout.nid[i]![j + 1]!;
          const pairKey = `${Math.min(leftId, rightId)},${Math.max(leftId, rightId)}`;
          if (!activePartnerPairs.has(pairKey)) continue;
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
        };

        if (isDouble) {
          connector.doubleSegment = {
            type: 'line',
            x1,
            y1: tempy + boxh / 10,
            x2,
            y2: tempy + boxh / 10,
          };
        }

        groupLines.push(connector);
      }
    }
  }

  // --- Parent-child lines ---
  for (let i = 1; i < maxlev; i++) {
    const familyIds = [...new Set(layout.fam[i]!.filter((v) => v > 0))];

    for (const fam of familyIds) {
      // Couple is the two columns bracketing the group line that fam points to.
      // fam is 1-based: fam=1 means group line between col 0 and col 1.
      const coupleLeft = fam - 1;
      const parentLevelN = layout.n[i - 1] ?? 0;
      const hasPartnerRight =
        coupleLeft + 1 < parentLevelN &&
        (layout.group[i - 1]?.[coupleLeft] ?? 0) > 0;
      const coupleRight = hasPartnerRight ? coupleLeft + 1 : coupleLeft;
      const parentx =
        coupleLeft === coupleRight
          ? layout.pos[i - 1]![coupleLeft]!
          : (layout.pos[i - 1]![coupleLeft]! +
              layout.pos[i - 1]![coupleRight]!) /
            2;

      // Find children in this family, separating out married-in group members
      // whose sibling bar would overlap with their partner's family
      const whoIdx: number[] = [];
      const marriedInIdx: number[] = [];
      for (let j = 0; j < layout.fam[i]!.length; j++) {
        if (layout.fam[i]![j] !== fam) continue;
        // A group member (married-in partner) gets an individual parent
        // connection to avoid overlapping sibling bars
        if (layout.groupMember[i]?.[j]) {
          marriedInIdx.push(j);
        } else {
          whoIdx.push(j);
        }
      }

      // Determine the primary edge type for this family
      const firstIdx = whoIdx[0] ?? marriedInIdx[0]!;
      const firstChildId = layout.nid[i]![firstIdx]!;
      const childParents = parents[firstChildId] ?? [];
      const primaryEdgeType =
        childParents.find((p) => p.edgeType === 'parent')?.edgeType ?? 'parent';

      // Skip the normal sibling bar if all children are married-in
      if (whoIdx.length === 0) {
        // Render each married-in member with an individual connector
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
          const link = buildParentLink(childX, parentx, i, boxh, legh, branch);
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
        // Twin grouping logic
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

      // Sibling bar (will be extended below if diagonal joins are used)
      const minTarget = Math.min(...target);
      const maxTarget = Math.max(...target);
      const siblingBar: LineSegment = {
        type: 'line',
        x1: minTarget,
        y1: i - legh,
        x2: maxTarget,
        y2: i - legh,
      };

      // Check if the couple bracket is an active partner pair.
      // When not active, render diagonal joins from each parent instead.
      const coupleLeftId = layout.nid[i - 1]![coupleLeft]!;
      const coupleRightId =
        coupleRight !== coupleLeft ? layout.nid[i - 1]![coupleRight]! : -1;
      const coupleIsActive =
        coupleRight !== coupleLeft &&
        (!activePartnerPairs ||
          activePartnerPairs.has(
            `${Math.min(coupleLeftId, coupleRightId)},${Math.max(coupleLeftId, coupleRightId)}`,
          ));

      // Find all parent positions for this family's children (for diagonal joins)
      const allParentPositions: { x: number; idx: number }[] = [];
      if (!coupleIsActive) {
        const parentIndices = new Set<number>();
        for (const childIdx of [...whoIdx, ...marriedInIdx]) {
          const childId = layout.nid[i]![childIdx]!;
          for (const pc of parents[childId] ?? []) {
            if (pc.edgeType === 'parent') parentIndices.add(pc.parentIndex);
          }
        }
        // Find positions of these parents in the parent level
        for (let pj = 0; pj < parentLevelN; pj++) {
          const pid = layout.nid[i - 1]![pj]!;
          if (parentIndices.has(pid)) {
            allParentPositions.push({ x: layout.pos[i - 1]![pj]!, idx: pid });
          }
        }
      }

      // Parent link
      const targetRange = maxTarget - minTarget;
      let x1: number;
      if (targetRange < 2 * pconnect) {
        x1 = (minTarget + maxTarget) / 2;
      } else {
        x1 = Math.max(
          minTarget + pconnect,
          Math.min(maxTarget - pconnect, parentx),
        );
      }

      const y1 = i - legh;
      const parentLink: LineSegment[] = [];

      const parentCenterY = i - 1 + boxh / 2;
      const parentBottomY = i - 1 + boxh;

      if (!coupleIsActive && allParentPositions.length >= 2) {
        // Diagonal join: each parent gets a diagonal line to a junction,
        // then a vertical line descends to the sibling bar.
        const junctionX =
          allParentPositions.reduce((sum, p) => sum + p.x, 0) /
          allParentPositions.length;
        const junctionY = parentBottomY + (y1 - parentBottomY) * 0.65;

        for (const pp of allParentPositions) {
          parentLink.push({
            type: 'line',
            x1: pp.x,
            y1: parentCenterY,
            x2: junctionX,
            y2: junctionY,
          });
        }
        // Vertical from junction to sibling bar connection point
        parentLink.push({
          type: 'line',
          x1: junctionX,
          y1: junctionY,
          x2: junctionX,
          y2: y1,
        });
        // Extend sibling bar to include the junction X so the vertical
        // line visually connects to the children's uplines
        if (junctionX < minTarget) {
          siblingBar.x1 = junctionX;
        }
        if (junctionX > maxTarget) {
          siblingBar.x2 = junctionX;
        }
      } else {
        const x2 = parentx;

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
        const miLink = buildParentLink(childX, parentx, i, boxh, legh, branch);
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
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const childId = layout.nid[i]![j]!;
      const childParents = parents[childId] ?? [];

      for (const pc of childParents) {
        if (pc.edgeType === 'donor' || pc.edgeType === 'surrogate') {
          // Find the auxiliary parent's position in the layout
          for (let pi = 0; pi < maxlev; pi++) {
            for (let pj = 0; pj < (layout.n[pi] ?? 0); pj++) {
              if (layout.nid[pi]![pj] === pc.parentIndex) {
                const parentX = layout.pos[pi]![pj]!;
                const parentY = pi + boxh / 2;
                const childX = layout.pos[i]![j]!;
                const childY = i + boxh / 2;

                auxiliaryLines.push({
                  type: 'auxiliary',
                  edgeType: pc.edgeType,
                  segment: {
                    type: 'line',
                    x1: parentX,
                    y1: parentY,
                    x2: childX,
                    y2: childY,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  // --- Auxiliary lines for unpartnered parents ---
  // Use the activePartnerPairs set (if provided) to determine which parents
  // are in active partnerships. Only active partners count as "partnered"
  // for the purpose of deciding unpartnered-parent auxiliary treatment.
  // Falls back to layout group data when activePartnerPairs is not provided.
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

  // Build a lookup: nodeId -> layout position
  const nodePosition = new Map<number, { x: number; y: number }>();
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const nid = layout.nid[i]![j]!;
      if (!nodePosition.has(nid)) {
        nodePosition.set(nid, { x: layout.pos[i]![j]!, y: i });
      }
    }
  }

  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const childId = layout.nid[i]![j]!;
      const childParents = parents[childId] ?? [];

      const parentEdges = childParents.filter((pc) => pc.edgeType === 'parent');
      if (parentEdges.length < 2) continue;

      // Determine which parents are in a partner group with another parent of this child
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

      // Only applies when some parents are partnered and others are not
      if (partneredParents.size === 0) continue;

      for (const parentId of parentIds) {
        if (partneredParents.has(parentId)) continue;

        const parentPos = nodePosition.get(parentId);
        if (!parentPos) continue;

        const childX = layout.pos[i]![j]!;
        const childY = i + boxh / 2;

        auxiliaryLines.push({
          type: 'auxiliary',
          edgeType: 'unpartnered-parent',
          segment: {
            type: 'line',
            x1: parentPos.x,
            y1: parentPos.y + boxh / 2,
            x2: childX,
            y2: childY,
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
