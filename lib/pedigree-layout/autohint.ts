import {
  type Hints,
  type PedigreeInput,
  type PedigreeLayout,
  type Relation,
  type SpouseHint,
} from '~/lib/pedigree-layout/types';
import { kindepth } from '~/lib/pedigree-layout/kindepth';
import { rank } from '~/lib/pedigree-layout/utils';

type LayoutFn = (
  ped: PedigreeInput,
  options: {
    packed?: boolean;
    width?: number;
    align?: boolean | number[];
    hints?: Hints;
  },
) => PedigreeLayout;

/**
 * Automatically generate layout hints for a pedigree.
 * Port of kinship2::autohint (autohint.R)
 *
 * Computes sibling order and spouse pairing hints to resolve
 * duplicate appearances and layout ambiguities.
 *
 * @param layoutFn - layout function injected to break circular dependency
 */
export function autohint(
  ped: PedigreeInput,
  options: {
    hints?: Partial<Hints>;
    packed?: boolean;
    align?: boolean | number[];
  } = {},
  layoutFn?: LayoutFn,
): Hints {
  // If pedigree already has hints, return them
  if (ped.hints) return ped.hints;

  const n = ped.id.length;
  const depth = kindepth(ped.motherIndex, ped.fatherIndex, true);
  const { packed = true, align = false } = options;

  // Build relation matrix
  const relation: Relation[] = ped.relation ?? [];

  // Twin processing (-1 = not in a twin set, >= 0 = twin set ID)
  const twinset = new Array<number>(n).fill(-1);
  const twinord = new Array<number>(n).fill(1);
  let twinrel: Relation[] | null = null;

  const twinRelations = relation.filter((r) => r.code < 4);
  if (twinRelations.length > 0) {
    twinrel = twinRelations;
    const twinlist = [...new Set(twinRelations.flatMap((r) => [r.id1, r.id2]))];

    // Iteratively assign twin set IDs (using min person index as set ID)
    for (let iter = 1; iter < twinlist.length; iter++) {
      for (const rel of twinRelations) {
        const newid = Math.min(rel.id1, rel.id2);
        twinset[rel.id1] = newid;
        twinset[rel.id2] = newid;
        twinord[rel.id2] = Math.max(twinord[rel.id2]!, twinord[rel.id1]! + 1);
      }
    }
  }

  // Initialize horder
  let horder: number[];
  if (options.hints) {
    if (options.hints.order) {
      horder = [...options.hints.order];
    } else {
      horder = new Array<number>(n).fill(0);
    }
  } else {
    horder = new Array<number>(n).fill(0);
  }

  // Fill in missing horder values per depth level
  for (const d of [...new Set(depth)]) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (depth[i] === d && horder[i] === 0) indices.push(i);
    }
    if (indices.length > 0) {
      for (let k = 0; k < indices.length; k++) {
        horder[indices[k]!] = k + 1;
      }
    }
  }

  // Cluster twins using fractional hints
  if (twinset.some((v) => v >= 0)) {
    for (const setId of [...new Set(twinset)]) {
      if (setId < 0) continue;
      const who: number[] = [];
      for (let i = 0; i < n; i++) {
        if (twinset[i] === setId) who.push(i);
      }
      const mean = who.reduce((s, i) => s + horder[i]!, 0) / who.length;
      for (const i of who) {
        horder[i] = mean + twinord[i]! / 100;
      }
    }

    // Reset to integers per depth level
    for (const d of [...new Set(depth)]) {
      const who: number[] = [];
      for (let i = 0; i < n; i++) {
        if (depth[i] === d) who.push(i);
      }
      const values = who.map((i) => horder[i]!);
      const ranked = rank(values);
      for (let k = 0; k < who.length; k++) {
        horder[who[k]!] = ranked[k]!;
      }
    }
  }

  let sptemp: SpouseHint[] | undefined = options.hints?.spouse
    ? [...options.hints.spouse]
    : undefined;

  if (!layoutFn) {
    throw new Error('autohint requires a layoutFn parameter');
  }

  let plist = layoutFn(ped, {
    packed,
    align,
    hints: { order: horder, spouse: sptemp },
  });

  // Helper: find the spouse group positions around mypos
  function findspouse(mypos: number, pl: PedigreeLayout, lev: number): number {
    let lpos = mypos;
    while (lpos > 0 && pl.spouse[lev]![lpos - 1]! > 0) lpos--;
    let rpos = mypos;
    while (pl.spouse[lev]![rpos]! > 0) rpos++;
    if (rpos === lpos) throw new Error('autohint bug 3');

    // Find first opposite-sex position
    const myNid = pl.nid[lev]![mypos]!;
    const mySex = ped.sex[myNid];
    for (let p = lpos; p <= rpos; p++) {
      const pNid = pl.nid[lev]![p]!;
      if (ped.sex[pNid] !== mySex) return p;
    }
    throw new Error('autohint bug 4');
  }

  // Helper: find siblings in the same family group
  function findsibs(mypos: number, pl: PedigreeLayout, lev: number): number[] {
    const family = pl.fam[lev]![mypos]!;
    if (family === 0) throw new Error('autohint bug 6');
    const result: number[] = [];
    for (let j = 0; j < (pl.n[lev] ?? 0); j++) {
      if (pl.fam[lev]![j] === family) result.push(j);
    }
    return result;
  }

  // Helper: shift a person within their sibling set
  function shift(
    id: number,
    sibs: number[],
    goleft: boolean,
    ho: number[],
    tr: Relation[] | null,
    ts: number[],
  ): number[] {
    if (ts[id]! >= 0) {
      const sibHorders = sibs.map((s) => ho[s]!);
      const shiftAmt = 1 + Math.max(...sibHorders) - Math.min(...sibHorders);
      const twins = sibs.filter((s) => ts[s] === ts[id]);

      for (const t of twins) {
        ho[t] = ho[t]! + (goleft ? -shiftAmt : shiftAmt);
      }

      // Check for monozygotic twins that need to stay together
      if (tr) {
        const hasMono = tr.some(
          (r) => (r.id1 === id || r.id2 === id) && r.code === 1,
        );
        if (hasMono) {
          const monoRel = tr.filter((r) => r.code === 1);
          let monoset = [id];
          for (const _ of twins) {
            void _;
            const newIds: number[] = [];
            for (const m of monoset) {
              for (const r of monoRel) {
                if (r.id1 === m && !monoset.includes(r.id2)) newIds.push(r.id2);
                if (r.id2 === m && !monoset.includes(r.id1)) newIds.push(r.id1);
              }
            }
            monoset = [...new Set([...monoset, ...newIds])];
          }
          for (const m of monoset) {
            ho[m] = ho[m]! + (goleft ? -shiftAmt : shiftAmt);
          }
        }
      }
    }

    // Move the subject
    const sibHorders = sibs.map((s) => ho[s]!);
    if (goleft) {
      ho[id] = Math.min(...sibHorders) - 1;
    } else {
      ho[id] = Math.max(...sibHorders) + 1;
    }

    // Re-rank to avoid negatives
    const ranked = rank(sibs.map((s) => ho[s]!));
    for (let k = 0; k < sibs.length; k++) {
      ho[sibs[k]!] = ranked[k]!;
    }

    return ho;
  }

  // Helper: find duplicate pairs and order them for processing
  function duporder(
    idlist: number[],
    pl: PedigreeLayout,
    lev: number,
  ): number[][] {
    const counts = new Map<number, number>();
    for (const id of idlist) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    // Check if any duplicates
    let hasDups = false;
    for (const c of counts.values()) {
      if (c > 1) {
        hasDups = true;
        break;
      }
    }
    if (!hasDups) return [];

    // Build pairs list
    const pairs: number[][] = [];
    const duplicateIds = [...counts.entries()]
      .filter(([, c]) => c > 1)
      .map(([id]) => id);

    for (const id of duplicateIds) {
      const positions: number[] = [];
      for (let j = 0; j < idlist.length; j++) {
        if (idlist[j] === id) positions.push(j);
      }
      for (let k = 1; k < positions.length; k++) {
        pairs.push([
          positions[k - 1]!,
          positions[k]!,
          k <= positions.length / 2 ? 1 : 2,
        ]);
      }
    }

    if (pairs.length <= 1) return pairs;

    // Sort by whether families touch, then by distance
    const famtouch: boolean[] = pairs.map((pair) => {
      let sib1: number;
      if (pl.fam[lev]![pair[0]!]! > 0) {
        sib1 = Math.max(...findsibs(pair[0]!, pl, lev));
      } else {
        try {
          const sp = findspouse(pair[0]!, pl, lev);
          const famVal1 = pl.fam[lev]![sp] ?? 0;
          if (famVal1 === 0) return false;
          sib1 = Math.max(...findsibs(sp, pl, lev));
        } catch {
          return false;
        }
      }

      let sib2: number;
      if (pl.fam[lev]![pair[1]!]! > 0) {
        sib2 = Math.min(...findsibs(pair[1]!, pl, lev));
      } else {
        try {
          const sp = findspouse(pair[1]!, pl, lev);
          const famVal2 = pl.fam[lev]![sp] ?? 0;
          if (famVal2 === 0) return false;
          sib2 = Math.min(...findsibs(sp, pl, lev));
        } catch {
          return false;
        }
      }

      return sib2 - sib1 === 1;
    });

    // Sort: touching families first, then by pair distance
    const indices = pairs.map((_, i) => i);
    indices.sort((a, b) => {
      const ta = famtouch[a] ? 1 : 0;
      const tb = famtouch[b] ? 1 : 0;
      if (ta !== tb) return ta - tb;
      return pairs[a]![0]! - pairs[a]![1]! - (pairs[b]![0]! - pairs[b]![1]!);
    });

    return indices.map((i) => pairs[i]!);
  }

  // Main fixup loop: process each level for duplicates
  const maxlev = plist.nid.length;
  for (let lev = 0; lev < maxlev; lev++) {
    const idlist = plist.nid[lev]!.slice(0, plist.n[lev]);
    const dpairs = duporder(idlist, plist, lev);
    if (dpairs.length === 0) continue;

    for (const pair of dpairs) {
      const anchor = [0, 0];
      const spouse = [0, 0];

      for (let j = 0; j < 2; j++) {
        const direction = j === 1;
        const mypos = pair[j]!;

        if (plist.fam[lev]![mypos]! > 0) {
          // Connected to parents at this location
          anchor[j] = 1; // familial anchor
          const sibs = findsibs(mypos, plist, lev).map((s) => idlist[s]!);
          if (sibs.length > 1) {
            horder = shift(
              idlist[mypos]!,
              sibs,
              direction,
              horder,
              twinrel,
              twinset,
            );
          }
        } else {
          // Check if spouse is connected to parents
          try {
            spouse[j] = findspouse(mypos, plist, lev);
            if (plist.fam[lev]![spouse[j]!]! > 0) {
              anchor[j] = 2; // spousal anchor
              const sibs = findsibs(spouse[j]!, plist, lev).map(
                (s) => idlist[s]!,
              );
              if (sibs.length > 1) {
                horder = shift(
                  idlist[spouse[j]!]!,
                  sibs,
                  direction,
                  horder,
                  twinrel,
                  twinset,
                );
              }
            }
          } catch {
            // spouse not found, anchor stays 0
          }
        }
      }

      // Add marriage hints based on anchor combination
      const id1 = idlist[pair[0]!]!;
      const id2 = spouse[0]! >= 0 ? idlist[spouse[0]!]! : 0;
      const id3 = spouse[1]! >= 0 ? idlist[spouse[1]!]! : 0;
      const key = `${anchor[0]}${anchor[1]}`;

      let temp: SpouseHint[] | null = null;
      switch (key) {
        case '21':
          temp = [{ leftIndex: id2, rightIndex: id1, anchor: pair[2]! }];
          break;
        case '22':
          temp = [
            { leftIndex: id2, rightIndex: id1, anchor: 1 },
            { leftIndex: id1, rightIndex: id3, anchor: 2 },
          ];
          break;
        case '02':
          temp = [{ leftIndex: id2, rightIndex: id1, anchor: 0 }];
          break;
        case '20':
          temp = [{ leftIndex: id2, rightIndex: id1, anchor: 0 }];
          break;
        case '00':
          temp = [
            { leftIndex: id1, rightIndex: id3, anchor: 0 },
            { leftIndex: id2, rightIndex: id1, anchor: 0 },
          ];
          break;
        case '01':
          temp = [{ leftIndex: id2, rightIndex: id1, anchor: 2 }];
          break;
        case '10':
          temp = [{ leftIndex: id1, rightIndex: id2, anchor: 1 }];
          break;
        default:
          // Unexpected case: return simple ordering
          return { order: Array.from({ length: n }, (_, k) => k + 1) };
      }

      if (temp) {
        sptemp = [...(sptemp ?? []), ...temp];
      }
    }

    // Recompute layout after processing this level
    plist = layoutFn(ped, {
      packed,
      align,
      hints: { order: horder, spouse: sptemp },
    });
  }

  return { order: horder, spouse: sptemp };
}
