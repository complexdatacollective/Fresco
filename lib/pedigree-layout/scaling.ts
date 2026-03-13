import {
  type PedigreeLayout,
  type ScalingParams,
} from '~/lib/pedigree-layout/types';

/**
 * Compute scaling parameters for pedigree rendering.
 * Port of plot.pedigree.R sizing logic (lines 118-143).
 *
 * Converts layout coordinates to scaled rendering coordinates.
 *
 * @param layout - pedigree layout with positions
 * @param plotWidth - available width in rendering units
 * @param plotHeight - available height in rendering units
 * @param symbolSize - relative symbol size (default 1)
 * @param labelHeight - height reserved for labels below symbols
 */
export function computeScaling(
  layout: PedigreeLayout,
  plotWidth: number,
  plotHeight: number,
  symbolSize = 1,
  labelHeight = 0,
): ScalingParams {
  // Compute x-range from positions
  let xmin = Infinity;
  let xmax = -Infinity;
  for (let i = 0; i < layout.nid.length; i++) {
    for (let j = 0; j < (layout.n[i] ?? 0); j++) {
      const p = layout.pos[i]![j]!;
      if (p < xmin) xmin = p;
      if (p > xmax) xmax = p;
    }
  }

  const xrange = xmax - xmin;
  const maxlev = layout.nid.length;

  // Size constraints (simplified from R's device-dependent logic):
  // ht1: available height per level minus label space
  const ht1 = plotHeight / maxlev - labelHeight;
  // ht2: height if levels get 1.5x spacing
  const ht2 = plotHeight / (maxlev + (maxlev - 1) / 2);
  // wd2: width-based constraint
  const wd2 = (0.8 * plotWidth) / (0.8 + xrange);
  // stemp1: approximate character width constraint
  const stemp1 = plotWidth * 0.15;

  const boxsize = symbolSize * Math.min(ht1, ht2, stemp1, wd2);
  const hScale = xrange > 0 ? (plotWidth - boxsize) / xrange : 1;
  const vScale =
    maxlev > 1
      ? (plotHeight - labelHeight - boxsize) / (maxlev - 1)
      : plotHeight;

  const boxWidth = hScale > 0 ? boxsize / hScale : boxsize;
  const boxHeight = vScale > 0 ? boxsize / vScale : boxsize;
  const legHeight = Math.min(0.25, boxHeight * 1.5);

  return {
    boxWidth,
    boxHeight,
    legHeight,
    hScale,
    vScale,
  };
}
