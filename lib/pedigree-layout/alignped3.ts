import { type AlignmentArrays } from '~/lib/pedigree-layout/types';

/**
 * Merge two pedigree alignment structures side-by-side.
 * Port of kinship2::alignped3 (alignped3.R)
 *
 * Handles overlap detection (same person in both trees) and
 * slide calculation for positioning.
 */
export function alignped3(
  x1: AlignmentArrays,
  x2: AlignmentArrays,
  packed: boolean,
  space = 1,
): AlignmentArrays {
  const maxlev = x1.n.length;
  const maxcol = Math.max(...x1.n.map((v, i) => v + x2.n[i]!));
  const n1Max = Math.max(...x1.n);
  const n = x1.n.map((v, i) => v + x2.n[i]!);

  // Initialize with x1's data
  const nid: number[][] = [];
  const pos: number[][] = [];
  const fam: number[][] = [];
  for (let i = 0; i < maxlev; i++) {
    nid[i] = new Array<number>(maxcol).fill(0);
    pos[i] = new Array<number>(maxcol).fill(0);
    fam[i] = new Array<number>(maxcol).fill(0);
    for (let j = 0; j < n1Max; j++) {
      nid[i]![j] = x1.nid[i]?.[j] ?? 0;
      pos[i]![j] = x1.pos[i]?.[j] ?? 0;
      fam[i]![j] = x1.fam[i]?.[j] ?? 0;
    }
  }

  // Deep copy x2's fam for modification
  const fam2: number[][] = x2.fam.map((row) => [...row]);

  let slide = 0;
  if (!packed) {
    // Unpacked mode: compute global slide
    for (let i = 0; i < maxlev; i++) {
      const n1 = x1.n[i]!;
      const n2 = x2.n[i]!;
      if (n1 > 0 && n2 > 0) {
        let temp: number;
        if (nid[i]![n1 - 1] === x2.nid[i]![0]) {
          temp = pos[i]![n1 - 1]! - x2.pos[i]![0]!;
        } else {
          temp = space + pos[i]![n1 - 1]! - x2.pos[i]![0]!;
        }
        if (temp > slide) slide = temp;
      }
    }
  }

  // Merge rows
  for (let i = 0; i < maxlev; i++) {
    const n1 = x1.n[i]!;
    const n2 = x2.n[i]!;
    if (n2 <= 0) continue;

    let overlap = 0;
    if (n1 > 0 && nid[i]![n1 - 1] === Math.floor(x2.nid[i]![0]!)) {
      // Two subjects overlap
      overlap = 1;
      fam[i]![n1 - 1] = Math.max(fam[i]![n1 - 1]!, fam2[i]![0]!);
      nid[i]![n1 - 1] = Math.max(nid[i]![n1 - 1]!, x2.nid[i]![0]!); // preserve .5
      if (!packed) {
        if (fam2[i]![0]! > 0) {
          if (fam[i]![n1 - 1]! > 0) {
            pos[i]![n1 - 1] = (x2.pos[i]![0]! + pos[i]![n1 - 1]! + slide) / 2;
          } else {
            pos[i]![n1 - 1] = x2.pos[i]![0]! + slide;
          }
        }
      }
      n[i] = n[i]! - 1;
    }

    if (packed) {
      slide = n1 === 0 ? 0 : pos[i]![n1 - 1]! + space - overlap;
    }

    // Copy x2 data (after overlap) into merged arrays
    for (let k = overlap; k < n2; k++) {
      const destCol = n1 + k - overlap;
      nid[i]![destCol] = x2.nid[i]![k]!;
      fam[i]![destCol] = fam2[i]![k]!;
      pos[i]![destCol] = x2.pos[i]![k]! + slide;
    }

    // Adjust child family pointers for the next level
    if (i < maxlev - 1) {
      const nextFam = fam2[i + 1]!;
      for (let j = 0; j < nextFam.length; j++) {
        if (nextFam[j]! !== 0) {
          nextFam[j] = nextFam[j]! + n1 - overlap;
        }
      }
    }
  }

  // Trim to actual max columns used
  const actualMax = Math.max(...n);
  if (actualMax < maxcol) {
    for (let i = 0; i < maxlev; i++) {
      nid[i] = nid[i]!.slice(0, actualMax);
      pos[i] = pos[i]!.slice(0, actualMax);
      fam[i] = fam[i]!.slice(0, actualMax);
    }
  }

  return { n, nid, pos, fam, spouselist: [] };
}
