import { type AlignmentArrays } from '~/lib/pedigree-layout/types';
import { solveQP } from '~/lib/pedigree-layout/solveQP';

/**
 * Final position optimization using quadratic programming.
 * Port of kinship2::alignped4 (alignped4.R)
 *
 * Builds penalty matrices for spouse closeness and child-parent centering,
 * then solves a QP to find optimal x-positions.
 *
 * @param rval - alignment arrays from previous stages
 * @param spouse - boolean matrix: spouse[i][j] true if j is a spouse at level i
 * @param level - unused here but kept for API compatibility
 * @param width - max layout width
 * @param align - [penalty1, penalty2] or true for defaults [1.5, 2]
 */
export function alignped4(
  rval: AlignmentArrays,
  spouse: boolean[][],
  _level: number[],
  width: number,
  align: number[] | boolean,
): number[][] {
  const alignParams =
    typeof align === 'boolean' || !Array.isArray(align) ? [1.5, 2] : align;

  const maxlev = rval.nid.length;

  // Width must be > the longest row
  width = Math.max(width, Math.max(...rval.n) + 0.01);

  const totalN = rval.n.reduce((a, b) => a + b, 0);

  // Number the plotting points sequentially
  const myid: number[][] = Array.from({ length: maxlev }, () =>
    new Array<number>(rval.nid[0]!.length).fill(0),
  );
  let cumN = 0;
  for (let i = 0; i < maxlev; i++) {
    let count = 0;
    for (let j = 0; j < rval.nid[i]!.length; j++) {
      if (rval.nid[i]![j]! > 0) {
        myid[i]![j] = cumN + count + 1; // 1-based numbering
        count++;
      }
    }
    cumN += rval.n[i]!;
  }

  // Count penalties
  let npenal = 0;
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < rval.nid[i]!.length; j++) {
      if (rval.nid[i]![j]! > 0 && spouse[i]?.[j]) npenal++;
      if (rval.fam[i]![j]! > 0) npenal++;
    }
  }

  // Penalty matrix: (npenal+1) x totalN, 0-indexed
  const pmat: number[][] = Array.from({ length: npenal + 1 }, () =>
    new Array<number>(totalN).fill(0),
  );

  let indx = -1;

  // Penalties to keep spouses close
  for (let lev = 0; lev < maxlev; lev++) {
    const spouseCols: number[] = [];
    for (let j = 0; j < (spouse[lev]?.length ?? 0); j++) {
      if (spouse[lev]![j]) spouseCols.push(j);
    }
    if (spouseCols.length > 0) {
      const sqrtAlign2 = Math.sqrt(alignParams[1]!);
      for (const col of spouseCols) {
        indx++;
        const id1 = myid[lev]![col]!;
        const id2 = myid[lev]![col + 1]!;
        if (id1 > 0) pmat[indx]![id1 - 1] = sqrtAlign2;
        if (id2 > 0) pmat[indx]![id2 - 1] = -sqrtAlign2;
      }
    }
  }

  // Penalties to keep kids close to parents
  for (let lev = 1; lev < maxlev; lev++) {
    const families = [...new Set(rval.fam[lev]!.filter((v) => v > 0))];

    for (const famId of families) {
      const who: number[] = [];
      for (let j = 0; j < rval.fam[lev]!.length; j++) {
        if (rval.fam[lev]![j] === famId) who.push(j);
      }
      const k = who.length;
      const penalty = Math.sqrt(Math.pow(k, -alignParams[0]!));

      for (const col of who) {
        indx++;
        const childId = myid[lev]![col]!;
        if (childId > 0) pmat[indx]![childId - 1] = -penalty;

        // Parent pair: fam points to column index in parent level
        const famCol = rval.fam[lev]![col]!;
        const parentId1 = myid[lev - 1]![famCol - 1]!; // R is 1-based fam
        const parentId2 = myid[lev - 1]![famCol]!;
        const prow = pmat[indx];
        if (prow && parentId1 > 0)
          prow[parentId1 - 1] = (prow[parentId1 - 1] ?? 0) + penalty / 2;
        if (prow && parentId2 > 0)
          prow[parentId2 - 1] = (prow[parentId2 - 1] ?? 0) + penalty / 2;
      }
    }
  }

  // Anchor: add small penalty to first element of widest row
  const maxRow = rval.n.indexOf(Math.max(...rval.n));
  const anchorId = myid[maxRow]![0]!;
  if (anchorId > 0) pmat[npenal]![anchorId - 1] = 1e-5;

  // Build constraint matrix
  const ncon = totalN + maxlev; // one ordering constraint per adjacent pair + boundary
  const cmat: number[][] = Array.from({ length: ncon }, () =>
    new Array<number>(totalN).fill(0),
  );
  const dvec = new Array<number>(ncon).fill(1);

  let coff = 0;
  for (let lev = 0; lev < maxlev; lev++) {
    const nn = rval.n[lev]!;
    // Ordering constraints: pos[j+1] - pos[j] >= 1
    for (let i = 0; i < nn - 1; i++) {
      const id1 = myid[lev]![i]!;
      const id2 = myid[lev]![i + 1]!;
      if (id1 > 0) cmat[coff + i]![id1 - 1] = -1;
      if (id2 > 0) cmat[coff + i]![id2 - 1] = 1;
    }

    // First element >= 0
    const firstId = myid[lev]![0]!;
    if (firstId > 0) cmat[coff + nn - 1]![firstId - 1] = 1;
    dvec[coff + nn - 1] = 0;

    // Last element <= width - 1 (i.e., -last >= 1-width)
    const lastId = myid[lev]![nn - 1]!;
    if (lastId > 0) cmat[coff + nn]![lastId - 1] = -1;
    dvec[coff + nn] = 1 - width;

    coff += nn + 1;
  }

  // Compute Hessian: pp = pmat^T * pmat + 1e-8 * I
  const pp: number[][] = Array.from({ length: totalN }, () =>
    new Array<number>(totalN).fill(0),
  );
  for (let i = 0; i < totalN; i++) {
    for (let j = 0; j < totalN; j++) {
      let sum = 0;
      for (let k = 0; k <= npenal; k++) {
        sum += pmat[k]![i]! * pmat[k]![j]!;
      }
      pp[i]![j] = sum + (i === j ? 1e-8 : 0);
    }
  }

  // Transpose constraint matrix for solve.QP (wants A^T format as columns)
  const cmatT: number[][] = Array.from({ length: totalN }, () =>
    new Array<number>(ncon).fill(0),
  );
  for (let i = 0; i < ncon; i++) {
    for (let j = 0; j < totalN; j++) {
      cmatT[j]![i] = cmat[i]![j]!;
    }
  }

  const fit = solveQP(pp, new Array<number>(totalN).fill(0), cmatT, dvec);

  // Map solution back to position matrix
  const newpos: number[][] = rval.pos.map((row) => [...row]);
  for (let i = 0; i < maxlev; i++) {
    for (let j = 0; j < rval.nid[i]!.length; j++) {
      const id = myid[i]![j]!;
      if (id > 0) {
        newpos[i]![j] = fit.solution[id - 1]!;
      }
    }
  }

  return newpos;
}
