import {
  type AlignmentArrays,
  type SpouseEntry,
} from '~/lib/pedigree-layout/types';
import { alignped2 } from '~/lib/pedigree-layout/alignped2';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';

/**
 * Lay out one person and all descendants.
 * Port of kinship2::alignped1 (alignped1.R)
 *
 * Determines spouse placement (left/right), recursively lays out
 * children of each marriage via alignped2, and merges subtrees.
 */
export function alignped1(
  x: number,
  dad: number[],
  mom: number[],
  level: number[],
  horder: number[],
  packed: boolean,
  spouselist: SpouseEntry[],
): AlignmentArrays {
  const maxlev = Math.max(...level) + 1; // levels are 0-based depth, we need count
  const lev = level[x]!;
  const n = new Array<number>(maxlev).fill(0);

  // Find spouses from spouselist
  let spouse: number[] = [];
  let sprows: number[] = [];

  if (spouselist.length > 0) {
    // Check if x appears as column 1 (left/male side)
    const isCol1 = spouselist.some((row) => row[0] === x);
    if (isCol1) {
      // sex=1 (male): spouses where col1==x and (col4==col3 or col4==0)
      for (let i = 0; i < spouselist.length; i++) {
        const row = spouselist[i]!;
        if (row[0] === x && (row[3] === row[2] || row[3] === 0)) {
          spouse.push(row[1]);
          sprows.push(i);
        }
      }
    } else {
      // sex=2 (female): spouses where col2==x and (col4!=col3 or col4==0)
      for (let i = 0; i < spouselist.length; i++) {
        const row = spouselist[i]!;
        if (row[1] === x && (row[3] !== row[2] || row[3] === 0)) {
          spouse.push(row[0]);
          sprows.push(i);
        }
      }
    }

    // Determine sex code for this person based on spouselist position
    const sex = isCol1 ? 1 : 2;

    // Marriages that cross levels: keep only spouses at same or higher level
    if (spouse.length > 0) {
      const keepIdx: number[] = [];
      for (let i = 0; i < spouse.length; i++) {
        if (level[spouse[i]!]! <= lev) {
          keepIdx.push(i);
        }
      }
      spouse = keepIdx.map((i) => spouse[i]!);
      sprows = keepIdx.map((i) => sprows[i]!);
    }

    const nspouse = spouse.length;

    // Initialize matrices
    const nid: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nspouse + 1).fill(0),
    );
    const famMat: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nspouse + 1).fill(0),
    );
    const pos: number[][] = Array.from({ length: maxlev }, () =>
      new Array<number>(nspouse + 1).fill(0),
    );

    n[lev] = nspouse + 1;
    for (let j = 0; j <= nspouse; j++) {
      pos[lev]![j] = j;
    }

    if (nspouse === 0) {
      nid[lev]![0] = x;
      return { nid, pos, fam: famMat, n, spouselist };
    }

    // Separate left and right spouses using anchor columns 3-4
    const lspouse: number[] = [];
    const rspouse: number[] = [];
    const undecided: number[] = [];

    for (let i = 0; i < sprows.length; i++) {
      const row = spouselist[sprows[i]!]!;
      if (row[2] === 3 - sex) {
        // left: col3 == 3-sex
        lspouse.push(spouse[i]!);
      } else if (row[2] === sex) {
        // right: col3 == sex
        rspouse.push(spouse[i]!);
      } else {
        // col3 == 0, undecided
        undecided.push(i);
      }
    }

    // Distribute undecided spouses
    if (undecided.length > 0) {
      const totalLeft = Math.floor((sprows.length + (sex === 2 ? 1 : 0)) / 2);
      let nleft = totalLeft - lspouse.length;
      if (nleft > 0) {
        const take = Math.min(nleft, undecided.length);
        for (let i = 0; i < take; i++) {
          lspouse.push(spouse[undecided[i]!]!);
        }
        undecided.splice(0, take);
        nleft -= take;
      }
      for (const idx of undecided) {
        rspouse.unshift(spouse[idx]!);
      }
    }

    // Fill level row: [lspouse..., x, rspouse...]
    const levelRow = [...lspouse, x, ...rspouse];
    for (let j = 0; j < levelRow.length; j++) {
      nid[lev]![j] = levelRow[j]!;
    }
    // Mark spouses with .5
    for (let j = 0; j < nspouse; j++) {
      nid[lev]![j] = nid[lev]![j]! + 0.5;
    }

    // Remove consumed entries from spouselist
    const consumedSet = new Set(sprows);
    spouselist = spouselist.filter((_, i) => !consumedSet.has(i));

    // Process children for each spouse
    let nokids = true;
    let rval: AlignmentArrays | null = null;
    const orderedSpouse = [...lspouse, ...rspouse];

    for (let i = 0; i < orderedSpouse.length; i++) {
      const ispouse = orderedSpouse[i]!;
      // Find children of (x, ispouse)
      const children: number[] = [];
      for (let j = 0; j < dad.length; j++) {
        if (
          (dad[j] === x && mom[j] === ispouse) ||
          (dad[j] === ispouse && mom[j] === x)
        ) {
          children.push(j);
        }
      }

      if (children.length > 0) {
        const rval1 = alignped2(
          children,
          dad,
          mom,
          level,
          horder,
          packed,
          spouselist,
        );
        spouselist = rval1.spouselist;

        // Set parentage for children on next level
        const nextLev = lev + 1;
        if (nextLev < maxlev) {
          const tempRow = rval1.nid[nextLev]!;
          for (let j = 0; j < tempRow.length; j++) {
            const floorVal = Math.floor(tempRow[j]!);
            if (children.includes(floorVal)) {
              rval1.fam[nextLev]![j] = i + 1; // 1-based family index (position in level row)
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
              for (let j = i; j <= nspouse; j++) {
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
      return { nid, pos, fam: famMat, n, spouselist };
    }

    // Splice parent level into children's result
    if (rval!.nid[0]!.length >= nspouse + 1) {
      // rval has room for the parent row
      rval!.n[lev] = n[lev]!;
      for (let j = 0; j <= nspouse; j++) {
        rval!.nid[lev]![j] = nid[lev]![j]!;
        rval!.pos[lev]![j] = pos[lev]![j]!;
      }
    } else {
      // Parent structure has room for children's data
      const rvalCols = rval!.nid[0]!.length;
      for (let row = lev + 1; row < maxlev; row++) {
        n[row] = rval!.n[row]!;
        for (let j = 0; j < rvalCols; j++) {
          nid[row]![j] = rval!.nid[row]![j]!;
          pos[row]![j] = rval!.pos[row]![j]!;
          famMat[row]![j] = rval!.fam[row]![j]!;
        }
      }
      rval = { nid, pos, fam: famMat, n, spouselist: [] };
    }

    rval!.spouselist = spouselist;
    return rval!;
  }

  // No spouselist at all — single person, no spouses
  const nid: number[][] = Array.from({ length: maxlev }, () => [0]);
  const famMat: number[][] = Array.from({ length: maxlev }, () => [0]);
  const pos: number[][] = Array.from({ length: maxlev }, () => [0]);
  n[lev] = 1;
  nid[lev]![0] = x;
  return { nid, pos, fam: famMat, n, spouselist };
}
