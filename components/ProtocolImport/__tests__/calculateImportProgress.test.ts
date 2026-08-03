import { describe, expect, it } from 'vitest';
import { calculateImportProgress } from '../calculateImportProgress';

describe('calculateImportProgress', () => {
  const PHASE_SIZE = 100 / 7;

  it('returns 0 for parsing phase', () => {
    expect(calculateImportProgress('parsing')).toBe(0);
  });

  it('returns 1/7 for validating phase', () => {
    expect(calculateImportProgress('validating')).toBeCloseTo(PHASE_SIZE);
  });

  it('returns 2/7 for checking-duplicates phase', () => {
    expect(calculateImportProgress('checking-duplicates')).toBeCloseTo(
      PHASE_SIZE * 2,
    );
  });

  it('returns 3/7 for extracting-assets phase', () => {
    expect(calculateImportProgress('extracting-assets')).toBeCloseTo(
      PHASE_SIZE * 3,
    );
  });

  it('subdivides uploading-protocol by phase progress', () => {
    expect(calculateImportProgress('uploading-protocol', 0)).toBeCloseTo(
      PHASE_SIZE * 4,
    );
    expect(calculateImportProgress('uploading-protocol', 50)).toBeCloseTo(
      PHASE_SIZE * 4 + PHASE_SIZE * 0.5,
    );
    expect(calculateImportProgress('uploading-protocol', 100)).toBeCloseTo(
      PHASE_SIZE * 5,
    );
  });

  it('subdivides uploading-assets by phase progress', () => {
    expect(calculateImportProgress('uploading-assets', 0)).toBeCloseTo(
      PHASE_SIZE * 5,
    );
    expect(calculateImportProgress('uploading-assets', 50)).toBeCloseTo(
      PHASE_SIZE * 5 + PHASE_SIZE * 0.5,
    );
    expect(calculateImportProgress('uploading-assets', 100)).toBeCloseTo(
      PHASE_SIZE * 6,
    );
  });

  it('clamps uploading-assets progress to 0-100', () => {
    expect(calculateImportProgress('uploading-assets', -10)).toBeCloseTo(
      PHASE_SIZE * 5,
    );
    expect(calculateImportProgress('uploading-assets', 150)).toBeCloseTo(
      PHASE_SIZE * 6,
    );
  });

  it('returns 6/7 for saving phase', () => {
    expect(calculateImportProgress('saving')).toBeCloseTo(PHASE_SIZE * 6);
  });

  it('returns 100 for complete phase', () => {
    expect(calculateImportProgress('complete')).toBe(100);
  });

  it('returns 0 for error phase', () => {
    expect(calculateImportProgress('error')).toBe(0);
  });
});
