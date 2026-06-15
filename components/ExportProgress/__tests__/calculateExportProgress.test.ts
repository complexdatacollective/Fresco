import { describe, expect, it } from 'vitest';
import { calculateExportProgress } from '~/components/ExportProgress/calculateExportProgress';

describe('calculateExportProgress', () => {
  it('maps stages onto an overall percentage band', () => {
    expect(calculateExportProgress({ stage: 'fetching' })).toBe(5);
    expect(calculateExportProgress({ stage: 'formatting' })).toBe(20);
    expect(
      calculateExportProgress({ stage: 'generating', current: 0, total: 10 }),
    ).toBe(30);
    expect(
      calculateExportProgress({ stage: 'generating', current: 10, total: 10 }),
    ).toBe(70);
    expect(
      calculateExportProgress({ stage: 'outputting', current: 5, total: 10 }),
    ).toBe(85);
  });

  it('is monotonic and clamped to 0..100', () => {
    expect(
      calculateExportProgress({ stage: 'generating', current: 999, total: 10 }),
    ).toBeLessThanOrEqual(70);
    expect(
      calculateExportProgress({ stage: 'outputting', current: 0, total: 0 }),
    ).toBeGreaterThanOrEqual(70);
  });
});
