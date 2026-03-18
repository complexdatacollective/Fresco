import { describe, expect, it } from 'vitest';
import type {
  BooleanFilterConfig,
  RangeFilterConfig,
} from '~/components/DataTable/filters/types';
import { generateChipLabel } from '~/components/DataTable/filters/chipLabels';

describe('generateChipLabel', () => {
  it('generates range label with formatLabel', () => {
    const config: RangeFilterConfig = {
      type: 'range',
      min: 0,
      max: 100,
      formatLabel: (v) => `${v}%`,
    };
    expect(generateChipLabel('Progress', config, { min: 25, max: 75 })).toBe(
      'Progress: 25% \u2013 75%',
    );
  });

  it('shows preset label when value matches preset exactly', () => {
    const config: RangeFilterConfig = {
      type: 'range',
      min: 0,
      max: 100,
      presets: [{ label: 'Complete', min: 100, max: 100 }],
    };
    expect(generateChipLabel('Progress', config, { min: 100, max: 100 })).toBe(
      'Progress: Complete',
    );
  });

  it('generates boolean label for true', () => {
    const config: BooleanFilterConfig = {
      type: 'boolean',
      trueLabel: 'Exported',
      falseLabel: 'Not Exported',
    };
    expect(generateChipLabel('Export Status', config, true)).toBe(
      'Export Status: Exported',
    );
  });

  it('generates boolean label for false', () => {
    const config: BooleanFilterConfig = {
      type: 'boolean',
      trueLabel: 'Exported',
      falseLabel: 'Not Exported',
    };
    expect(generateChipLabel('Export Status', config, false)).toBe(
      'Export Status: Not Exported',
    );
  });
});
