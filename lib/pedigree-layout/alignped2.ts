import {
  type AlignmentArrays,
  type SpouseEntry,
} from '~/lib/pedigree-layout/types';
import { alignped1 } from '~/lib/pedigree-layout/alignped1';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';

/**
 * Lay out a set of siblings.
 * Port of kinship2::alignped2 (alignped2.R)
 *
 * Sorts siblings by horder, calls alignped1 for each,
 * and merges results with alignped3.
 */
export function alignped2(
  x: number[],
  dad: number[],
  mom: number[],
  level: number[],
  horder: number[],
  packed: boolean,
  spouselist: SpouseEntry[],
): AlignmentArrays {
  // Sort siblings by horder
  const sorted = [...x].sort((a, b) => (horder[a] ?? 0) - (horder[b] ?? 0));

  let rval = alignped1(sorted[0]!, dad, mom, level, horder, packed, spouselist);
  spouselist = rval.spouselist;

  if (sorted.length > 1) {
    const mylev = level[sorted[0]!]!;
    for (let i = 1; i < sorted.length; i++) {
      const rval2 = alignped1(
        sorted[i]!,
        dad,
        mom,
        level,
        horder,
        packed,
        spouselist,
      );
      spouselist = rval2.spouselist;

      // Special case: skip merge if sibling already on their level
      // (can happen with inbreeding)
      const alreadyOnLevel =
        rval.nid[mylev]
          ?.slice(0, rval.n[mylev])
          .some((v) => Math.floor(v) === sorted[i]) ?? false;

      if (rval2.n[mylev]! > 1 || !alreadyOnLevel) {
        rval = alignped3(rval, rval2, packed);
      }
    }
    rval.spouselist = spouselist;
  }

  return rval;
}
