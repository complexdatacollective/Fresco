import { type Hints, type Sex } from '~/lib/pedigree-layout/types';

/**
 * Validate hint consistency for pedigree layout.
 * Port of kinship2::check.hint (check.hint.R)
 */
export function checkHint(hints: Hints, sex: Sex[]): Hints {
  const n = sex.length;

  if (!hints.order) {
    throw new Error('Missing order component');
  }
  if (hints.order.length !== n) {
    throw new Error('Wrong length for order component');
  }

  if (!hints.spouse) return hints;

  for (const sp of hints.spouse) {
    if (
      sp.leftIndex < 0 ||
      sp.leftIndex >= n ||
      sp.rightIndex < 0 ||
      sp.rightIndex >= n
    ) {
      throw new Error('Invalid spouse value');
    }

    const leftSex = sex[sp.leftIndex];
    const rightSex = sex[sp.rightIndex];
    const validPair =
      (leftSex === 'female' && rightSex === 'male') ||
      (rightSex === 'female' && leftSex === 'male');

    if (!validPair) {
      throw new Error('A marriage is not male/female');
    }
  }

  return hints;
}
