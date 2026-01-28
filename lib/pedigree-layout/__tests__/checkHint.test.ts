import { describe, expect, it } from 'vitest';
import { checkHint } from '~/lib/pedigree-layout/checkHint';
import { type Sex } from '~/lib/pedigree-layout/types';

describe('checkHint', () => {
  const sex: Sex[] = ['male', 'female', 'male'];

  it('passes valid hints through', () => {
    const hints = { order: [1, 2, 3] };
    expect(checkHint(hints, sex)).toEqual(hints);
  });

  it('throws on missing order', () => {
    expect(() => checkHint({ order: [] }, sex)).toThrow(
      'Wrong length for order component',
    );
  });

  it('throws on wrong length order', () => {
    expect(() => checkHint({ order: [1, 2] }, sex)).toThrow(
      'Wrong length for order component',
    );
  });

  it('validates spouse pairs are male/female', () => {
    const hints = {
      order: [1, 2, 3],
      spouse: [{ leftIndex: 0, rightIndex: 1, anchor: 0 }],
    };
    // male + female — should pass
    expect(() => checkHint(hints, sex)).not.toThrow();
  });

  it('throws on same-sex spouse pair', () => {
    const hints = {
      order: [1, 2, 3],
      spouse: [{ leftIndex: 0, rightIndex: 2, anchor: 0 }],
    };
    // male + male — should fail
    expect(() => checkHint(hints, sex)).toThrow(
      'A marriage is not male/female',
    );
  });

  it('throws on out-of-range spouse index', () => {
    const hints = {
      order: [1, 2, 3],
      spouse: [{ leftIndex: 0, rightIndex: 5, anchor: 0 }],
    };
    expect(() => checkHint(hints, sex)).toThrow('Invalid spouse value');
  });
});
