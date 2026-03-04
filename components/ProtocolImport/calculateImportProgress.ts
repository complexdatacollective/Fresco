export type ImportPhase =
  | 'parsing'
  | 'validating'
  | 'checking-duplicates'
  | 'extracting-assets'
  | 'uploading-assets'
  | 'saving'
  | 'complete'
  | 'error';

const PHASES: ImportPhase[] = [
  'parsing',
  'validating',
  'checking-duplicates',
  'extracting-assets',
  'uploading-assets',
  'saving',
];

const PHASE_COUNT = PHASES.length;
const PHASE_SIZE = 100 / PHASE_COUNT;

/**
 * Calculates overall import progress (0-100) from a phase and optional
 * sub-phase progress. Each of the 6 processing phases gets an equal 1/6
 * segment. For `uploading-assets`, `phaseProgress` (0-100) subdivides
 * that segment. Other phases snap to their start percentage on entry.
 */
export function calculateImportProgress(
  phase: ImportPhase,
  phaseProgress = 0,
): number {
  if (phase === 'complete') return 100;
  if (phase === 'error') return 0;

  const phaseIndex = PHASES.indexOf(phase);
  if (phaseIndex === -1) return 0;

  const base = phaseIndex * PHASE_SIZE;

  if (phase === 'uploading-assets') {
    const clampedProgress = Math.min(Math.max(phaseProgress, 0), 100);
    return base + (clampedProgress / 100) * PHASE_SIZE;
  }

  return base;
}
