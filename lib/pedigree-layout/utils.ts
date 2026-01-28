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

// Chase all ancestors of a person (from align.pedigree.R:95-103)
export function ancestor(
  me: number,
  momIdx: number[],
  dadIdx: number[],
): number[] {
  let alist = [me];
  for (;;) {
    const newEntries: number[] = [];
    for (const idx of alist) {
      const m = momIdx[idx];
      const d = dadIdx[idx];
      if (m !== undefined && m >= 0) newEntries.push(m);
      if (d !== undefined && d >= 0) newEntries.push(d);
    }
    const merged = [...new Set([...alist, ...newEntries])].sort(
      (a, b) => a - b,
    );
    if (merged.length === alist.length) break;
    alist = merged;
  }
  return alist.filter((x) => x !== me);
}

// Chase up ancestors (from kindepth.R:74-83)
// Returns all ancestors reachable from x
export function chaseup(x: number[], midx: number[], didx: number[]): number[] {
  let result = [...x];
  let newItems = x.flatMap((idx) => {
    const items: number[] = [];
    const m = midx[idx];
    const d = didx[idx];
    if (m !== undefined && m >= 0) items.push(m);
    if (d !== undefined && d >= 0) items.push(d);
    return items;
  });

  while (newItems.length > 0) {
    result = [...new Set([...result, ...newItems])];
    newItems = newItems.flatMap((idx) => {
      const items: number[] = [];
      const m = midx[idx];
      const d = didx[idx];
      if (m !== undefined && m >= 0) items.push(m);
      if (d !== undefined && d >= 0) items.push(d);
      return items;
    });
    newItems = newItems.filter((item) => !result.includes(item));
  }
  return result;
}

// Check if a value is a spouse marker (has .5 fractional part)
export function isSpouseMarker(val: number): boolean {
  return val !== Math.floor(val);
}
