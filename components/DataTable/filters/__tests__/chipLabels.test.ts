import { describe, expect, it } from 'vitest';
import { generateChipLabel } from '~/components/DataTable/filters/chipLabels';
import type {
  BooleanFilterConfig,
  RangeFilterConfig,
} from '~/components/DataTable/filters/types';

describe('generateChipLabel', () => {
  it('formats range with formatLabel', () => {
    const config: RangeFilterConfig = {
      type: 'range',
      min: 0,
      max: 100,
      formatLabel: (v) => `${String(v)}%`,
    };
    const result = generateChipLabel('Progress', config, {
      min: 10,
      max: 90,
    });
    expect(result).toBe('Progress: 10% – 90%');
  });

  it('returns preset label when range matches a preset', () => {
    const config: RangeFilterConfig = {
      type: 'range',
      min: 0,
      max: 100,
      presets: [{ label: 'All', min: 0, max: 100 }],
    };
    const result = generateChipLabel('Size', config, { min: 0, max: 100 });
    expect(result).toBe('Size: All');
  });

  it('formats boolean true with trueLabel', () => {
    const config: BooleanFilterConfig = {
      type: 'boolean',
      trueLabel: 'Yes',
      falseLabel: 'No',
    };
    const result = generateChipLabel('Active', config, true);
    expect(result).toBe('Active: Yes');
  });

  it('formats boolean false with falseLabel', () => {
    const config: BooleanFilterConfig = {
      type: 'boolean',
      trueLabel: 'Yes',
      falseLabel: 'No',
    };
    const result = generateChipLabel('Active', config, false);
    expect(result).toBe('Active: No');
  });
});
