import {
  type AlignmentArrays,
  type GroupEntry,
  type ParentConnection,
} from '~/lib/pedigree-layout/types';
import { alignped2 } from '~/lib/pedigree-layout/alignped2';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';

/**
 * Lay out one person and all descendants.
 *
 * Determines group member placement (left/right), recursively lays out
 * children of each parent group via alignped2, and merges subtrees.
 */
export function alignped1(
  x: number,
  parents: ParentConnection[][],
  level: number[],
  horder: number[],
  packed: boolean,
  grouplist: GroupEntry[],
): AlignmentArrays {
  const maxlev = Math.max(...level) + 1;
  const lev = level[x]!;
  const n = new Array<number>(maxlev).fill(0);

  // Find groups containing x from grouplist
  // GroupEntry format: [member1, member2, ..., anchorSide, anchorType]
  // The first N-2 elements are member indices
  let groupMembers: number[] = [];
  let grows: number[] = [];

  if (grouplist.length > 0) {
    for (let i = 0; i < grouplist.length; i++) {
      const entry = grouplist[i]!;
      const members = entry.slice(0, entry.length - 2);
      if (members.includes(x)) {
        // Collect all other members of this group
        const anchorSide = entry[entry.length - 2]!;
        const anchorType = entry[entry.length - 1]!;
        // Determine if x is the anchor based on anchorSide/anchorType
        const isAnchor = anchorType === anchorSide || anchorType === 0;
        if (isAnchor) {
          for (const m of members) {
            if (m !== x) {
              groupMembers.push(m);
              grows.push(i);
            }
          }
        }
      }
    }

    // Keep only members at same or higher level (cross-level filtering)
    if (groupMembers.length > 0) {
      const keepIdx: number[] = [];
      for (let i = 0; i < groupMembers.length; i++) {
        if (level[groupMembers[i]!]! <= lev) {
          keepIdx.push(i);
        }
      }
      groupMembers = keepIdx.map((i) => groupMembers[i]!);
      grows = keepIdx.map((i) => grows[i]!);
    }

    const nMembers = groupMembers.length;

    // Initialize matrices
    const nid: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nMembers + 1).fill(0),
    );
    const famMat: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nMembers + 1).fill(0),
    );
    const pos: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nMembers + 1).fill(0),
    );

    n[lev] = nMembers + 1;
    for (let j = 0; j <= nMembers; j++) {
      pos[lev]![j] = j;
    }

    if (nMembers === 0) {
      nid[lev]![0] = x;

      // Check for children of this single parent (no group members)
      const singleChildren: number[] = [];
      for (let j = 0; j < parents.length; j++) {
        const pConns = parents[j]!;
        if (pConns.length === 0) continue;
        if (pConns.some((p) => p.parentIndex === x)) {
          singleChildren.push(j);
        }
      }

      if (singleChildren.length === 0) {
        return { nid, pos, fam: famMat, n, grouplist };
      }

      // Layout children
      const rval1 = alignped2(
        singleChildren,
        parents,
        level,
        horder,
        packed,
        grouplist,
      );
      grouplist = rval1.grouplist;

      // Set parentage
      const nextLev = lev + 1;
      if (nextLev < maxlev) {
        const tempRow = rval1.nid[nextLev]!;
        for (let j = 0; j < tempRow.length; j++) {
          const floorVal = Math.floor(tempRow[j]!);
          if (singleChildren.includes(floorVal)) {
            rval1.fam[nextLev]![j] = 1;
          }
        }
      }

      // Splice parent into children result
      if (rval1.nid[0]!.length >= 1) {
        rval1.n[lev] = 1;
        rval1.nid[lev]![0] = x;
        rval1.pos[lev]![0] = 0;
      }
      rval1.grouplist = grouplist;
      return rval1;
    }

    // Separate left and right members using anchor columns
    const lMembers: number[] = [];
    const rMembers: number[] = [];
    const undecided: number[] = [];

    for (let i = 0; i < grows.length; i++) {
      const entry = grouplist[grows[i]!]!;
      const anchorSide = entry[entry.length - 2]!;
      // anchorSide determines placement relative to the anchor (x)
      // In the original: col3 == 3-sex means left, col3 == sex means right
      // We generalize: anchorSide 1 = member on left, anchorSide 2 = member on right
      if (anchorSide === 1) {
        lMembers.push(groupMembers[i]!);
      } else if (anchorSide === 2) {
        rMembers.push(groupMembers[i]!);
      } else {
        undecided.push(i);
      }
    }

    // Distribute undecided members
    if (undecided.length > 0) {
      const totalLeft = Math.floor(grows.length / 2);
      const nleft = totalLeft - lMembers.length;
      if (nleft > 0) {
        const take = Math.min(nleft, undecided.length);
        for (let i = 0; i < take; i++) {
          lMembers.push(groupMembers[undecided[i]!]!);
        }
        undecided.splice(0, take);
      }
      for (const idx of undecided) {
        rMembers.unshift(groupMembers[idx]!);
      }
    }

    // Fill level row: [lMembers..., x, rMembers...]
    const levelRow = [...lMembers, x, ...rMembers];
    for (let j = 0; j < levelRow.length; j++) {
      nid[lev]![j] = levelRow[j]!;
    }
    // Mark non-anchor members with .5
    for (let j = 0; j < lMembers.length; j++) {
      nid[lev]![j] = nid[lev]![j]! + 0.5;
    }
    for (let j = lMembers.length + 1; j < levelRow.length; j++) {
      nid[lev]![j] = nid[lev]![j]! + 0.5;
    }

    // Remove consumed entries from grouplist
    const consumedSet = new Set(grows);
    grouplist = grouplist.filter((_, i) => !consumedSet.has(i));

    // Process children for each group member pairing
    let nokids = true;
    let rval: AlignmentArrays | null = null;
    const orderedMembers = [...lMembers, ...rMembers];

    const assignedChildren = new Set<number>();
    for (let i = 0; i < orderedMembers.length; i++) {
      const member = orderedMembers[i]!;
      // Find children whose parents include both x and this member
      const children: number[] = [];
      for (let j = 0; j < parents.length; j++) {
        if (assignedChildren.has(j)) continue;
        const pConns = parents[j]!;
        if (pConns.length === 0) continue;
        const hasX = pConns.some((p) => p.parentIndex === x);
        const hasMember = pConns.some((p) => p.parentIndex === member);
        if (hasX && hasMember) {
          children.push(j);
          assignedChildren.add(j);
        }
      }

      if (children.length > 0) {
        const rval1 = alignped2(
          children,
          parents,
          level,
          horder,
          packed,
          grouplist,
        );
        grouplist = rval1.grouplist;

        // Set parentage for children on next level
        const nextLev = lev + 1;
        if (nextLev < maxlev) {
          const tempRow = rval1.nid[nextLev]!;
          for (let j = 0; j < tempRow.length; j++) {
            const floorVal = Math.floor(tempRow[j]!);
            if (children.includes(floorVal)) {
              rval1.fam[nextLev]![j] = i + 1; // 1-based family index
            }
          }
        }

        if (!packed && nextLev < maxlev) {
          // Line kids up below parents
          const famIdx = i + 1;
          const childPositions: number[] = [];
          for (let j = 0; j < (rval1.n[nextLev] ?? 0); j++) {
            if (rval1.fam[nextLev]![j] === famIdx) {
              childPositions.push(j);
            }
          }

          if (childPositions.length > 0) {
            const kidmean =
              childPositions.reduce(
                (sum, j) => sum + rval1.pos[nextLev]![j]!,
                0,
              ) / childPositions.length;
            const parmean = (pos[lev]![i]! + pos[lev]![i + 1]!) / 2;

            if (kidmean > parmean) {
              // Move parents right
              for (let j = i; j <= nMembers; j++) {
                pos[lev]![j] = pos[lev]![j]! + (kidmean - parmean);
              }
            } else {
              // Move kids and all below them
              const shift = parmean - kidmean;
              for (let j = nextLev; j < maxlev; j++) {
                const jn = rval1.n[j]!;
                for (let k = 0; k < jn; k++) {
                  rval1.pos[j]![k] = rval1.pos[j]![k]! + shift;
                }
              }
            }
          }
        }

        if (nokids) {
          rval = rval1;
          nokids = false;
        } else {
          rval = alignped3(rval!, rval1, packed);
        }
      }
    }

    if (nokids) {
      return { nid, pos, fam: famMat, n, grouplist };
    }

    // Splice parent level into children's result
    if (rval!.nid[0]!.length >= nMembers + 1) {
      rval!.n[lev] = n[lev]!;
      for (let j = 0; j <= nMembers; j++) {
        rval!.nid[lev]![j] = nid[lev]![j]!;
        rval!.pos[lev]![j] = pos[lev]![j]!;
      }
    } else {
      const rvalCols = rval!.nid[0]!.length;
      for (let row = lev + 1; row < maxlev; row++) {
        n[row] = rval!.n[row]!;
        for (let j = 0; j < rvalCols; j++) {
          nid[row]![j] = rval!.nid[row]![j]!;
          pos[row]![j] = rval!.pos[row]![j]!;
          famMat[row]![j] = rval!.fam[row]![j]!;
        }
      }
      rval = { nid, pos, fam: famMat, n, grouplist: [] };
    }

    rval!.grouplist = grouplist;
    return rval!;
  }

  // No grouplist — check for single-parent children
  const nid: number[][] = Array.from({ length: maxlev }, () => [0]);
  const famMat: number[][] = Array.from({ length: maxlev }, () => [0]);
  const pos: number[][] = Array.from({ length: maxlev }, () => [0]);
  n[lev] = 1;
  nid[lev]![0] = x;

  // Check for children of this single parent
  const singleChildren: number[] = [];
  for (let j = 0; j < parents.length; j++) {
    const pConns = parents[j]!;
    if (pConns.length === 0) continue;
    if (pConns.some((p) => p.parentIndex === x)) {
      singleChildren.push(j);
    }
  }

  if (singleChildren.length === 0) {
    return { nid, pos, fam: famMat, n, grouplist };
  }

  // Layout children
  const rval1 = alignped2(
    singleChildren,
    parents,
    level,
    horder,
    packed,
    grouplist,
  );
  grouplist = rval1.grouplist;

  // Set parentage
  const nextLev = lev + 1;
  if (nextLev < maxlev) {
    const tempRow = rval1.nid[nextLev]!;
    for (let j = 0; j < tempRow.length; j++) {
      const floorVal = Math.floor(tempRow[j]!);
      if (singleChildren.includes(floorVal)) {
        rval1.fam[nextLev]![j] = 1;
      }
    }
  }

  // Splice parent into children result
  if (rval1.nid[0]!.length >= 1) {
    rval1.n[lev] = 1;
    rval1.nid[lev]![0] = x;
    rval1.pos[lev]![0] = 0;
  }
  rval1.grouplist = grouplist;
  return rval1;
}
