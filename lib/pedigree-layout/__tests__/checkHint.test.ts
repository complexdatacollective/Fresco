import { describe, expect, it } from 'vitest';
import { checkHint } from '~/lib/pedigree-layout/checkHint';
import { type Hints } from '~/lib/pedigree-layout/types';

describe('checkHint', () => {
  it('passes valid hints through', () => {
    const hints: Hints = { order: [1, 2, 3] };
    expect(checkHint(hints, 3)).toEqual(hints);
  });

  it('throws on missing order', () => {
    expect(() => checkHint({ order: [] }, 3)).toThrow(
      'Wrong length for order component',
    );
  });

  it('throws on wrong length order', () => {
    expect(() => checkHint({ order: [1, 2] }, 3)).toThrow(
      'Wrong length for order component',
    );
  });

  it('validates group member indices are in range', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 5], anchor: 0 }],
    };
    expect(() => checkHint(hints, 3)).toThrow('Invalid group member index');
  });

  it('accepts any combination of people in a group', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 2], anchor: 0 }],
    };
    expect(() => checkHint(hints, 3)).not.toThrow();
  });

  it('accepts groups of 3+', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 1, 2], anchor: 0 }],
    };
    expect(() => checkHint(hints, 3)).not.toThrow();
  });
});
