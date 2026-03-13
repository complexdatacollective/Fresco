import { describe, expect, it } from 'vitest';
import { solveQP } from '~/lib/pedigree-layout/solveQP';

describe('solveQP', () => {
  it('solves a simple identity QP', () => {
    // min 0.5 * x^T I x + 0^T x
    // subject to x >= 0
    const Dmat = [
      [1, 0],
      [0, 1],
    ];
    const dvec = [0, 0];
    // Constraint: x1 >= 0, x2 >= 0 → A^T = I, b = [0,0]
    const Amat = [
      [1, 0],
      [0, 1],
    ];
    const bvec = [0, 0];

    const result = solveQP(Dmat, dvec, Amat, bvec);
    expect(result.solution[0]).toBeCloseTo(0, 5);
    expect(result.solution[1]).toBeCloseTo(0, 5);
  });

  it('solves the R quadprog example', () => {
    // R example: min -5*x2 + 0.5*(x1^2 + x2^2 + x3^2)
    // A^T x >= b with A and b from the example
    const Dmat = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const dvec = [0, 5, 0];
    const Amat = [
      [-4, 2, 0],
      [-3, 1, -2],
      [0, 0, 1],
    ];
    const bvec = [-8, 2, 0];

    const result = solveQP(Dmat, dvec, Amat, bvec);
    expect(result.solution[0]).toBeCloseTo(0.4762, 3);
    expect(result.solution[1]).toBeCloseTo(1.0476, 3);
    expect(result.solution[2]).toBeCloseTo(2.0952, 3);
  });
});
