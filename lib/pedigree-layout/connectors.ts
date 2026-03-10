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
  type Relation,
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
 * @param relations - relation array (partner=code 4) for group line styling
 * @param branch - branch style for parent-child links (0=diagonal, >0=right-angle). Default 0.6
 * @param pconnect - where parent link meets sibling bar (0-1). Default 0.5
 */
export function computeConnectors(
  layout: PedigreeLayout,
  scaling: ScalingParams,
  parents: ParentConnection[][],
  branch = 0.6,
  pconnect = 0.5,
  relations: Relation[] = [],
): PedigreeConnectors {
  const { boxHeight: boxh, legHeight: legh } = scaling;
  const maxlev = layout.nid.length;
  const maxcol = layout.nid[0]?.length ?? 0;

  const groupLines: ParentGroupConnector[] = [];
  const parentChildLines: ParentChildConnector[] = [];
  const auxiliaryLines: AuxiliaryConnector[] = [];
  const twinIndicators: TwinIndicator[] = [];
  const duplicateArcs: DuplicateArc[] = [];

  // Build partner pair lookup from relations (code 4 = partner)
  const partnerPairs = new Set<string>();
  for (const rel of relations) {
    if (rel.code === 4) {
      partnerPairs.add(
        `${Math.min(rel.id1, rel.id2)},${Math.max(rel.id1, rel.id2)}`,
      );
    }
  }

  // --- Parent group lines (replaces spouse lines) ---
  for (let i = 0; i < maxlev; i++) {
    const tempy = i + boxh / 2;
    for (let j = 0; j < maxcol; j++) {
      if (layout.group[i]?.[j] && layout.group[i]![j]! > 0) {
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

        // Check if these two adjacent members are partners
        const leftId = layout.nid[i]![j]!;
        const rightId = layout.nid[i]![j + 1]!;
        const pairKey = `${Math.min(leftId, rightId)},${Math.max(leftId, rightId)}`;
        const isPartner = partnerPairs.has(pairKey);

        const connector: ParentGroupConnector = {
          type: 'parent-group',
          segment,
          partner: isPartner,
          current: true,
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
      // Parent position (fam is 1-based column index in parent level)
      // Walk outward from fam-1 to find the full extent of the parent group
      let groupLeft = fam - 1;
      while (groupLeft > 0 && (layout.group[i - 1]?.[groupLeft - 1] ?? 0) > 0) {
        groupLeft--;
      }
      let groupRight = fam - 1;
      while (
        groupRight < maxcol - 1 &&
        (layout.group[i - 1]?.[groupRight] ?? 0) > 0
      ) {
        groupRight++;
      }
      const parentx =
        groupLeft === groupRight
          ? layout.pos[i - 1]![groupLeft]!
          : (layout.pos[i - 1]![groupLeft]! + layout.pos[i - 1]![groupRight]!) /
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
        childParents.find((p) => p.edgeType === 'social-parent')?.edgeType ??
        'social-parent';

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

  // --- Auxiliary lines for donor/surrogate/bio-parent edges ---
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const childId = layout.nid[i]![j]!;
      const childParents = parents[childId] ?? [];

      for (const pc of childParents) {
        if (
          pc.edgeType === 'donor' ||
          pc.edgeType === 'surrogate' ||
          pc.edgeType === 'bio-parent'
        ) {
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
