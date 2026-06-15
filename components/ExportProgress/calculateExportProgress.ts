type ExportStage = 'fetching' | 'formatting' | 'generating' | 'outputting';

// Each stage owns a band of the overall bar so progress never goes backwards.
const STAGE_BANDS: Record<ExportStage, { start: number; end: number }> = {
  fetching: { start: 5, end: 10 },
  formatting: { start: 20, end: 30 },
  generating: { start: 30, end: 70 },
  outputting: { start: 70, end: 100 },
};

export function calculateExportProgress(input: {
  stage: ExportStage;
  current?: number;
  total?: number;
}): number {
  const band = STAGE_BANDS[input.stage];
  if (input.total && input.total > 0 && input.current !== undefined) {
    const ratio = Math.min(Math.max(input.current / input.total, 0), 1);
    return Math.round(band.start + (band.end - band.start) * ratio);
  }
  return band.start;
}
