import qp from 'quadprog';

/**
 * Wrapper around the quadprog npm package (1-indexed Goldfarb-Idnani QP solver).
 * Provides a 0-indexed TypeScript interface.
 *
 * Solves: min( 0.5 * x^T D x + d^T x ) subject to A^T x >= b
 *
 * @param Dmat - n×n positive definite matrix (0-indexed 2D array)
 * @param dvec - length-n vector (0-indexed)
 * @param Amat - n×m constraint matrix (0-indexed 2D array), transposed as R's solve.QP expects
 * @param bvec - length-m constraint bounds (0-indexed)
 */
export function solveQP(
  Dmat: number[][],
  dvec: number[],
  Amat: number[][],
  bvec: number[],
): { solution: number[]; value: number } {
  const n = Dmat.length;
  const m = Amat[0]?.length ?? 0;

  // Convert 0-indexed to 1-indexed arrays for quadprog
  const Dmat1: number[][] = [[]]; // index 0 is unused
  for (let i = 0; i < n; i++) {
    Dmat1[i + 1] = [0]; // index 0 is unused
    for (let j = 0; j < n; j++) {
      Dmat1[i + 1]![j + 1] = Dmat[i]![j]!;
    }
  }

  const dvec1: number[] = [0]; // index 0 is unused
  for (let i = 0; i < n; i++) {
    dvec1[i + 1] = dvec[i]!;
  }

  const Amat1: number[][] = [[]]; // index 0 is unused
  for (let i = 0; i < n; i++) {
    Amat1[i + 1] = [0]; // index 0 is unused
    for (let j = 0; j < m; j++) {
      Amat1[i + 1]![j + 1] = Amat[i]![j]!;
    }
  }

  const bvec1: number[] = [0]; // index 0 is unused
  for (let j = 0; j < m; j++) {
    bvec1[j + 1] = bvec[j]!;
  }

  const result = qp.solveQP(Dmat1, dvec1, Amat1, bvec1);

  if (result.message) {
    throw new Error(`solveQP failed: ${result.message}`);
  }

  // Convert 1-indexed solution back to 0-indexed
  const solution: number[] = [];
  for (let i = 0; i < n; i++) {
    solution[i] = result.solution[i + 1]!;
  }

  return {
    solution,
    value: result.value[1]!,
  };
}
