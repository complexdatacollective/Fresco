import { chaseup } from '~/lib/pedigree-layout/utils';

/**
 * Compute the generational depth of each subject in a pedigree.
 * Depth = max number of generations to farthest founder ancestor.
 *
 * When align=true, adjusts depths so spouses plot on the same line.
 *
 * Port of kinship2::kindepth (kindepth.R)
 *
 * @param midx - 0-based index of each person's mother (-1 = no mother)
 * @param didx - 0-based index of each person's father (-1 = no father)
 * @param align - whether to align spouse depths
 */
export function kindepth(
  midx: number[],
  didx: number[],
  align = false,
): number[] {
  const n = midx.length;
  if (n === 1) return [0];

  // Founders: no mother and no father
  let parents: number[] = [];
  for (let i = 0; i < n; i++) {
    if (midx[i] === -1 && didx[i] === -1) {
      parents.push(i);
    }
  }

  const depth = new Array<number>(n).fill(0);

  // Iteratively assign depth: children of current parents get depth i
  for (let i = 1; i <= n; i++) {
    const nextParents: number[] = [];
    for (let j = 0; j < n; j++) {
      const m = midx[j]!;
      const d = didx[j]!;
      const matchMom = m >= 0 && parents.includes(m);
      const matchDad = d >= 0 && parents.includes(d);
      if (matchMom || matchDad) {
        nextParents.push(j);
      }
    }
    if (nextParents.length === 0) break;
    if (i === n) {
      throw new Error('Impossible pedigree: someone is their own ancestor');
    }
    for (const p of nextParents) {
      depth[p] = i;
    }
    parents = nextParents;
  }

  if (!align) return depth;

  // --- Alignment: adjust depths so spouses are on the same line ---

  // Collect all parent pairs (dad, mom) where both exist
  const dads: number[] = [];
  const moms: number[] = [];
  for (let i = 0; i < n; i++) {
    if (midx[i]! >= 0 && didx[i]! >= 0) {
      dads.push(didx[i]!);
      moms.push(midx[i]!);
    }
  }

  // Remove duplicate pairs
  const seen = new Set<number>();
  const uniqueDads: number[] = [];
  const uniqueMoms: number[] = [];
  for (let i = 0; i < dads.length; i++) {
    const hash = dads[i]! + moms[i]! * n;
    if (!seen.has(hash)) {
      seen.add(hash);
      uniqueDads.push(dads[i]!);
      uniqueMoms.push(moms[i]!);
    }
  }

  const npair = uniqueDads.length;
  const done = new Array<boolean>(npair).fill(false);

  for (;;) {
    // Find pairs where depth[dad] != depth[mom] and not yet done
    const pairsToFix: number[] = [];
    for (let i = 0; i < npair; i++) {
      if (!done[i] && depth[uniqueDads[i]!] !== depth[uniqueMoms[i]!]) {
        pairsToFix.push(i);
      }
    }
    if (pairsToFix.length === 0) break;

    // Pick the pair with smallest max depth
    const maxDepths = pairsToFix.map((idx) =>
      Math.max(depth[uniqueDads[idx]!]!, depth[uniqueMoms[idx]!]!),
    );
    const minMax = Math.min(...maxDepths);
    const who = pairsToFix.find(
      (idx) =>
        Math.max(depth[uniqueDads[idx]!]!, depth[uniqueMoms[idx]!]!) === minMax,
    )!;

    // "good" = closer to children (higher depth), "bad" = farther
    let good = uniqueMoms[who]!;
    let bad = uniqueDads[who]!;
    if (depth[uniqueDads[who]!]! > depth[uniqueMoms[who]!]!) {
      good = uniqueDads[who]!;
      bad = uniqueMoms[who]!;
    }

    const abad = chaseup([bad], midx, didx);

    // Simple case: solitary marry-in
    const badAppearances =
      uniqueDads.filter((d) => d === bad).length +
      uniqueMoms.filter((m) => m === bad).length;
    if (abad.length === 1 && badAppearances === 1) {
      depth[bad] = depth[good]!;
    } else {
      let agood = chaseup([good], midx, didx);

      // Chase spouses and their ancestors, excluding the given pair
      const tdad = uniqueDads.filter((_, i) => i !== who);
      const tmom = uniqueMoms.filter((_, i) => i !== who);

      for (;;) {
        // Find spouses of anyone in agood
        const spouses: number[] = [];
        for (let i = 0; i < tdad.length; i++) {
          if (agood.includes(tdad[i]!)) spouses.push(tmom[i]!);
          if (agood.includes(tmom[i]!)) spouses.push(tdad[i]!);
        }

        let temp = [...new Set([...agood, ...spouses])];
        temp = [...new Set(chaseup(temp, midx, didx))];

        // Add kids at or above good's depth
        for (let j = 0; j < n; j++) {
          const m = midx[j]!;
          const d = didx[j]!;
          if ((m >= 0 && temp.includes(m)) || (d >= 0 && temp.includes(d))) {
            if (depth[j]! <= depth[good]!) {
              temp = [...new Set([...temp, j])];
            }
          }
        }

        if (temp.length === agood.length) break;
        agood = temp;
      }

      // Only shift if no overlap between abad and agood
      if (!abad.some((a) => agood.includes(a))) {
        const shift = depth[good]! - depth[bad]!;
        for (const idx of abad) {
          depth[idx] = depth[idx]! + shift;
        }

        // Repair: ensure all children are below their parents
        for (let i = 0; i <= n; i++) {
          const currentParents: number[] = [];
          for (let j = 0; j < n; j++) {
            if (depth[j] === i) currentParents.push(j);
          }

          let anyChild = false;
          for (let j = 0; j < n; j++) {
            const m = midx[j]!;
            const d = didx[j]!;
            if (
              (m >= 0 && currentParents.includes(m)) ||
              (d >= 0 && currentParents.includes(d))
            ) {
              anyChild = true;
              depth[j] = Math.max(i + 1, depth[j]!);
            }
          }
          if (!anyChild) break;
        }
      }
    }

    // Mark pairs involving 'bad' as done
    for (let i = 0; i < npair; i++) {
      if (uniqueDads[i] === bad || uniqueMoms[i] === bad) {
        done[i] = true;
      }
    }
  }

  if (depth.every((d) => d > 0)) {
    throw new Error("Bug in kindepth's alignment code");
  }

  return depth;
}
