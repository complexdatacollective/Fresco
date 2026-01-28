import {
  type DuplicateArc,
  type LineSegment,
  type ParentChildConnector,
  type PedigreeConnectors,
  type PedigreeLayout,
  type Point,
  type ScalingParams,
  type SpouseConnector,
  type TwinIndicator,
} from '~/lib/pedigree-layout/types';

/**
 * Compute connector geometry for rendering a pedigree.
 * Port of plot.pedigree.R connector logic (lines 263-363).
 *
 * Produces abstract line segments and paths — no SVG or canvas dependency.
 *
 * @param layout - pedigree layout (positions, families, spouses, twins)
 * @param scaling - box sizing and scale factors
 * @param branch - branch style for parent-child links (0=diagonal, >0=right-angle). Default 0.6
 * @param pconnect - where parent link meets sibling bar (0-1). Default 0.5
 */
export function computeConnectors(
  layout: PedigreeLayout,
  scaling: ScalingParams,
  branch = 0.6,
  pconnect = 0.5,
): PedigreeConnectors {
  const { boxWidth: boxw, boxHeight: boxh, legHeight: legh } = scaling;
  const maxlev = layout.nid.length;
  const maxcol = layout.nid[0]?.length ?? 0;

  const spouseLines: SpouseConnector[] = [];
  const parentChildLines: ParentChildConnector[] = [];
  const twinIndicators: TwinIndicator[] = [];
  const duplicateArcs: DuplicateArc[] = [];

  // --- Spouse lines (R lines 263-279) ---
  for (let i = 0; i < maxlev; i++) {
    const tempy = i + boxh / 2;
    for (let j = 0; j < maxcol; j++) {
      if (layout.spouse[i]?.[j] && layout.spouse[i]![j]! > 0) {
        const x1 = layout.pos[i]![j]! + boxw / 2;
        const x2 = layout.pos[i]![j + 1]! - boxw / 2;
        const segment: LineSegment = {
          type: 'line',
          x1,
          y1: tempy,
          x2,
          y2: tempy,
        };

        const isDouble = layout.spouse[i]![j] === 2;
        const connector: SpouseConnector = {
          type: 'spouse',
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

        spouseLines.push(connector);
      }
    }
  }

  // --- Parent-child lines (R lines 280-342) ---
  for (let i = 1; i < maxlev; i++) {
    const familyIds = [...new Set(layout.fam[i]!.filter((v) => v > 0))];

    for (const fam of familyIds) {
      // Parent midpoint (fam is 1-based column index in parent level)
      const parentX1 = layout.pos[i - 1]![fam - 1]!;
      const parentX2 = layout.pos[i - 1]![fam]!;
      const parentx = (parentX1 + parentX2) / 2;

      // Find children in this family
      const whoIdx: number[] = [];
      for (let j = 0; j < layout.fam[i]!.length; j++) {
        if (layout.fam[i]![j] === fam) whoIdx.push(j);
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
        // cumsum with reset on non-twin
        const groups: number[] = [];
        let groupId = 0;
        for (const ttl of twinToLeft) {
          if (ttl === 0) groupId++;
          groups.push(groupId);
        }

        // Mean position per group
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
          y1: i,
          x2: target[k]!,
          y2: i - legh,
        });
      }

      // Twin indicators
      if (layout.twins) {
        // MZ twin line
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

          // Unknown twin "?"
          if (layout.twins[i]?.[whoIdx[k]!] === 3) {
            const temp1 = (layout.pos[i]![whoIdx[k]!]! + target[k]!) / 2;
            const temp2 = (layout.pos[i]![whoIdx[k + 1]!]! + target[k]!) / 2;
            twinIndicators.push({
              type: 'twin',
              code: 3,
              label: { x: (temp1 + temp2) / 2, y: i - legh / 2 },
            });
          }

          // DZ twin (code 2) — no special line, just recorded
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

      if (branch === 0) {
        // Single diagonal line
        parentLink.push({
          type: 'line',
          x1,
          y1,
          x2: parentx,
          y2: i - 1 + boxh / 2,
        });
      } else {
        // Three-segment right-angle path
        const y2 = i - 1 + boxh / 2;
        const x2 = parentx;
        const ydelta = ((y2 - y1) * branch) / 2;
        parentLink.push(
          { type: 'line', x1, y1, x2: x1, y2: y1 + ydelta },
          { type: 'line', x1, y1: y1 + ydelta, x2, y2: y2 - ydelta },
          { type: 'line', x1: x2, y1: y2 - ydelta, x2, y2 },
        );
      }

      parentChildLines.push({
        type: 'parent-child',
        uplines,
        siblingBar,
        parentLink,
      });
    }
  }

  // --- Duplicate subject arcs (R lines 344-363) ---
  const allIds = new Set<number>();
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const nid = layout.nid[i]![j]!;
      allIds.add(nid);
    }
  }

  for (const id of allIds) {
    // Find all positions of this person
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < maxlev; i++) {
      for (let j = 0; j < (layout.n[i] ?? 0); j++) {
        if (layout.nid[i]![j] === id) {
          positions.push({ x: layout.pos[i]![j]!, y: i });
        }
      }
    }

    if (positions.length > 1) {
      // Sort by x
      positions.sort((a, b) => a.x - b.x);

      for (let j = 0; j < positions.length - 1; j++) {
        const p1 = positions[j]!;
        const p2 = positions[j + 1]!;

        // Parabolic arc: 15 points
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
    spouseLines,
    parentChildLines,
    twinIndicators,
    duplicateArcs,
  };
}
