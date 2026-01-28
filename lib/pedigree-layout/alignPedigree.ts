import {
  type Hints,
  type PedigreeInput,
  type PedigreeLayout,
  type SpouseEntry,
} from '~/lib/pedigree-layout/types';
import { alignped1 } from '~/lib/pedigree-layout/alignped1';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';
import { alignped4 } from '~/lib/pedigree-layout/alignped4';
import { autohint } from '~/lib/pedigree-layout/autohint';
import { checkHint } from '~/lib/pedigree-layout/checkHint';
import { kindepth } from '~/lib/pedigree-layout/kindepth';
import { ancestor } from '~/lib/pedigree-layout/utils';

/**
 * Main pedigree layout algorithm.
 * Port of kinship2::align.pedigree (align.pedigree.R)
 *
 * Takes pedigree data and computes the aligned layout with positions.
 */
export function alignPedigree(
  ped: PedigreeInput,
  options: {
    packed?: boolean;
    width?: number;
    align?: boolean | number[];
    hints?: Hints;
  } = {},
): PedigreeLayout {
  const { packed = true, width = 10, align = true } = options;
  let { hints } = options;

  const n = ped.id.length;
  const dad = ped.fatherIndex;
  const mom = ped.motherIndex;

  // Validate: everyone must have 0 or 2 parents
  for (let i = 0; i < n; i++) {
    if ((dad[i] === -1) !== (mom[i] === -1)) {
      throw new Error(
        'Everyone must have 0 parents or 2 parents, not just one',
      );
    }
  }

  // Generate or validate hints
  if (!hints) {
    try {
      hints = autohint(ped, { packed, align: false });
    } catch {
      hints = { order: Array.from({ length: n }, (_, i) => i + 1) };
    }
  } else {
    hints = checkHint(hints, ped.sex);
  }

  // Compute depth (0-based) and add 1 for 1-based levels
  const depth = kindepth(mom, dad, true);
  const level = depth.map((d) => d + 1);

  const horder = hints.order;

  // Build relation matrix (if any)
  const relation = ped.relation ?? null;

  // Build spouse list
  let spouselist: SpouseEntry[] = [];

  // Add from hints
  if (hints.spouse) {
    for (const sp of hints.spouse) {
      const leftSex = ped.sex[sp.leftIndex];
      const isMale = leftSex === 'male';
      const col1 = isMale ? sp.leftIndex : sp.rightIndex;
      const col2 = isMale ? sp.rightIndex : sp.leftIndex;
      const col3 = 1 + (leftSex !== 'male' ? 1 : 0); // R: 1 + (tsex!='male')
      spouselist.push([col1, col2, col3, sp.anchor]);
    }
  }

  // Add spouse relations (code 4)
  if (relation) {
    for (const rel of relation) {
      if (rel.code === 4) {
        const s1 = ped.sex[rel.id1];
        if (s1 === 'male') {
          spouselist.push([rel.id1, rel.id2, 0, 0]);
        } else {
          spouselist.push([rel.id2, rel.id1, 0, 0]);
        }
      }
    }
  }

  // Add parent pairs
  for (let i = 0; i < n; i++) {
    if (dad[i]! >= 0 && mom[i]! >= 0) {
      spouselist.push([dad[i]!, mom[i]!, 0, 0]);
    }
  }

  // Deduplicate by hash
  const seen = new Set<number>();
  spouselist = spouselist.filter((entry) => {
    const hash = entry[0] * n + entry[1];
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });

  // Find founders: both parents of the spouse pair are founders (no parents)
  const noparents = spouselist.map((entry) => {
    const d0 = dad[entry[0]];
    const d1 = dad[entry[1]];
    return d0 === -1 && d1 === -1;
  });

  // Find founding mothers/fathers with multiple marriages
  const founderMoms = spouselist
    .filter((_, i) => noparents[i])
    .map((e) => e[1]);
  const founderDads = spouselist
    .filter((_, i) => noparents[i])
    .map((e) => e[0]);

  const dupMomSet = new Set<number>();
  const dupMom: number[] = [];
  for (const m of founderMoms) {
    if (dupMomSet.has(m)) dupMom.push(m);
    dupMomSet.add(m);
  }

  const dupDadSet = new Set<number>();
  const dupDad: number[] = [];
  for (const d of founderDads) {
    if (dupDadSet.has(d)) dupDad.push(d);
    dupDadSet.add(d);
  }

  const dupAll = new Set([...dupMom, ...dupDad]);

  // Founding mothers not in dupAll
  const foundMom = spouselist
    .filter(
      (entry, i) =>
        noparents[i] && !dupAll.has(entry[0]) && !dupAll.has(entry[1]),
    )
    .map((e) => e[1]);

  const founders = [...new Set([...dupMom, ...dupDad, ...foundMom])].sort(
    (a, b) => (horder[a] ?? 0) - (horder[b] ?? 0),
  );

  if (founders.length === 0) {
    throw new Error('No founders found in pedigree');
  }

  // Layout first founder
  let rval = alignped1(
    founders[0]!,
    dad,
    mom,
    level,
    horder,
    packed,
    spouselist,
  );

  // Merge remaining founders
  if (founders.length > 1) {
    spouselist = rval.spouselist;
    for (let i = 1; i < founders.length; i++) {
      const rval2 = alignped1(
        founders[i]!,
        dad,
        mom,
        level,
        horder,
        packed,
        spouselist,
      );
      spouselist = rval2.spouselist;
      rval = alignped3(rval, rval2, packed);
    }
  }

  // Unhash: separate nid and spouse from .5 encoding
  const maxdepth = rval.nid.length;
  const nid: number[][] = rval.nid.map((row) => row.map((v) => Math.floor(v)));
  const spouseMat: number[][] = rval.nid.map((row) =>
    row.map((v) => (v !== Math.floor(v) ? 1 : 0)),
  );

  // Detect consanguinity: spouse pairs with common ancestors get spouse=2
  for (let i = 0; i < maxdepth; i++) {
    for (let j = 0; j < spouseMat[i]!.length; j++) {
      if (spouseMat[i]![j]! > 0) {
        const a1 = ancestor(nid[i]![j]!, mom, dad);
        const a2 = ancestor(nid[i]![j + 1]!, mom, dad);
        const combined = [...a1, ...a2];
        if (combined.length !== new Set(combined).size) {
          spouseMat[i]![j] = 2;
        }
      }
    }
  }

  // Extract twin info
  let twins: number[][] | null = null;
  if (relation?.some((r) => r.code < 4)) {
    twins = nid.map((row) => row.map(() => 0));
    const twinRelations = relation.filter((r) => r.code < 4);

    // ntemp: only show nid where connected to parents (fam > 0)
    const ntemp: number[][] = rval.fam.map((famRow, i) =>
      famRow.map((f, j) => (f > 0 ? nid[i]![j]! : 0)),
    );

    for (const rel of twinRelations) {
      // Find positions of left and right twins in the ntemp matrix
      let lpos = -1;
      let rpos = -1;
      for (let row = 0; row < maxdepth; row++) {
        for (let col = 0; col < ntemp[row]!.length; col++) {
          if (ntemp[row]![col] === rel.id1 && lpos === -1) {
            lpos = row * ntemp[0]!.length + col;
          }
          if (ntemp[row]![col] === rel.id2 && rpos === -1) {
            rpos = row * ntemp[0]!.length + col;
          }
        }
      }

      if (lpos >= 0 && rpos >= 0) {
        const minPos = Math.min(lpos, rpos);
        const minRow = Math.floor(minPos / ntemp[0]!.length);
        const minCol = minPos % ntemp[0]!.length;
        twins[minRow]![minCol] = rel.code;
      }
    }
  }

  // Run position optimization
  let pos: number[][];
  const doAlign = align === true || (Array.isArray(align) && align.length > 0);
  const maxLevel = Math.max(...level);
  if (doAlign && maxLevel > 1) {
    const spouseBool = spouseMat.map((row) => row.map((v) => v > 0));
    pos = alignped4(rval, spouseBool, level, width, align);
  } else {
    pos = rval.pos.map((row) => [...row]);
  }

  return {
    n: rval.n,
    nid,
    pos,
    fam: rval.fam,
    spouse: spouseMat,
    twins,
  };
}
