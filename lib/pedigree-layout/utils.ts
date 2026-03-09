// Create a 2D array (matrix) with given dimensions and fill value
export function createMatrix<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill),
  );
}

// R's match(): find index of value in table, returns -1 if not found
export function matchIndex(value: number, table: number[]): number {
  return table.indexOf(value);
}

// R's which(): returns indices where predicate is true
export function which(arr: boolean[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) result.push(i);
  }
  return result;
}

// R's pmin(): parallel minimum of two arrays
export function pmin(a: number[], b: number[]): number[] {
  return a.map((val, i) => Math.min(val, b[i] ?? val));
}

// R's pmax(): parallel maximum of two arrays
export function pmax(a: number[], b: number[]): number[] {
  return a.map((val, i) => Math.max(val, b[i] ?? val));
}

// R's rank(): assign rank to each element (average rank for ties)
export function rank(arr: number[]): number[] {
  const indexed = arr.map((val, i) => ({ val, i }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array<number>(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j]!.val === indexed[i]!.val) {
      j++;
    }
    // Average rank for ties (1-based like R)
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k]!.i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

// R's table(): count occurrences of each value
export function tableCounts(arr: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const val of arr) {
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return counts;
}

import { type ParentConnection } from '~/lib/pedigree-layout/types';

// Chase all ancestors of a person
export function ancestor(me: number, parents: ParentConnection[][]): number[] {
  const n = parents.length;
  const result = new Array<boolean>(n).fill(false);

  // Seed with direct parents
  const myParents = parents[me] ?? [];
  for (const p of myParents) {
    result[p.parentIndex] = true;
  }

  // Chase up iteratively
  for (let iter = 0; iter < n; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (!result[i]) continue;
      for (const p of parents[i] ?? []) {
        if (!result[p.parentIndex]) {
          result[p.parentIndex] = true;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (result[i]) indices.push(i);
  }
  return indices;
}

// Chase up ancestors — returns all ancestors reachable from x (including x)
export function chaseup(x: number[], parents: ParentConnection[][]): number[] {
  const n = parents.length;
  const inSet = new Array<boolean>(n).fill(false);
  for (const idx of x) inSet[idx] = true;

  for (let iter = 0; iter < n; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (!inSet[i]) continue;
      for (const p of parents[i] ?? []) {
        if (!inSet[p.parentIndex]) {
          inSet[p.parentIndex] = true;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inSet[i]) result.push(i);
  }
  return result;
}

// Check if a value is a group member marker (has .5 fractional part)
export function isGroupMarker(val: number): boolean {
  return val !== Math.floor(val);
}
