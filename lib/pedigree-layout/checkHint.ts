import { type Hints } from '~/lib/pedigree-layout/types';

/**
 * Validate hint consistency for pedigree layout.
 *
 * @param hints - layout hints to validate
 * @param n - number of people in the pedigree
 */
export function checkHint(hints: Hints, n: number): Hints {
  if (!hints.order) {
    throw new Error('Missing order component');
  }
  if (hints.order.length !== n) {
    throw new Error('Wrong length for order component');
  }

  if (!hints.groups) return hints;

  for (const group of hints.groups) {
    for (const idx of group.members) {
      if (idx < 0 || idx >= n) {
        throw new Error('Invalid group member index');
      }
    }
  }

  return hints;
}
