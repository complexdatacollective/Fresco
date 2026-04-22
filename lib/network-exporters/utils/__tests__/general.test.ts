import { describe, expect, it } from 'vitest';
import { isCategoricalOptionSelected } from '~/lib/network-exporters/utils/general';

describe('isCategoricalOptionSelected', () => {
  // CategoricalBin writes scalar option values, so a stored `0` must still
  // match the corresponding option on export.
  it('treats stored 0 as selected when option value is 0', () => {
    expect(isCategoricalOptionSelected(0, 0)).toBe(true);
  });

  it('treats stored 0 as not selected for a different option value', () => {
    expect(isCategoricalOptionSelected(0, 1)).toBe(false);
  });

  // CheckboxGroup stores arrays; a falsy element must still match.
  it('treats [0] as selected when option value is 0', () => {
    expect(isCategoricalOptionSelected([0], 0)).toBe(true);
  });

  it('treats null as not selected', () => {
    expect(isCategoricalOptionSelected(null, 0)).toBe(false);
  });

  it('treats undefined as not selected', () => {
    expect(isCategoricalOptionSelected(undefined, 0)).toBe(false);
  });
});
