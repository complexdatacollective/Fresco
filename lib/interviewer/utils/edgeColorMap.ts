import { type EdgeColor } from '@codaco/protocol-validation';

/**
 * Maps codebook edge color names ('edge-color-seq-N') to Tailwind arbitrary
 * property classes that set the --edge-color CSS variable.
 *
 * Usage in Tailwind:
 * ```tsx
 * <div className={cx(edgeColorMap[edgeColor], 'bg-[var(--edge-color)]')} />
 * ```
 */
export const edgeColorMap: Record<EdgeColor, string> = {
  'edge-color-seq-1': '[--edge-color:var(--color-edge-1)]',
  'edge-color-seq-2': '[--edge-color:var(--color-edge-2)]',
  'edge-color-seq-3': '[--edge-color:var(--color-edge-3)]',
  'edge-color-seq-4': '[--edge-color:var(--color-edge-4)]',
  'edge-color-seq-5': '[--edge-color:var(--color-edge-5)]',
  'edge-color-seq-6': '[--edge-color:var(--color-edge-6)]',
  'edge-color-seq-7': '[--edge-color:var(--color-edge-7)]',
  'edge-color-seq-8': '[--edge-color:var(--color-edge-8)]',
};
