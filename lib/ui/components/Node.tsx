import { Loader2 } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

export const NodeColors = [
  'node-color-seq-1',
  'node-color-seq-2',
  'node-color-seq-3',
  'node-color-seq-4',
  'node-color-seq-5',
  'node-color-seq-6',
  'node-color-seq-7',
  'node-color-seq-8',
] as const;

export type NodeColorSequence = (typeof NodeColors)[number];

type UINodeProps = {
  color?: NodeColorSequence;
  label?: string;
  selected?: boolean;
  linking?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
} & Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & {
    disabled?: boolean;
  };

/**
 * Renders a Node.
 */
const Node = forwardRef<HTMLButtonElement, UINodeProps>((props, ref) => {
  const {
    label = 'Node',
    color = 'node-color-seq-1',
    selected = false,
    linking = false,
    loading = false,
    size = 'md',
    ...buttonProps
  } = props;
  const classes = cx(
    'inline-flex items-center justify-center rounded-full shadow-lg relative transition-all duration-300 spring-[0.2,0.5]',
    'disabled:saturate-50 disabled:cursor-not-allowed',
    'text-white text-lg font-semibold',
    size === 'sm' && 'h-32 w-32',
    size === 'md' && 'h-40 w-40',
    size === 'lg' && 'h-48 w-48',
    '[--base:var(--node-color-seq-1)] [--dark:var(--node-color-seq-1-dark)]',
    color === 'node-color-seq-1' &&
      '[--base:var(--node-color-seq-1)] [--dark:var(--node-color-seq-1-dark)]',
    color === 'node-color-seq-2' &&
      '[--base:var(--node-color-seq-2)] [--dark:var(--node-color-seq-2-dark)]',
    color === 'node-color-seq-3' &&
      '[--base:var(--node-color-seq-3)] [--dark:var(--node-color-seq-3-dark)]',
    color === 'node-color-seq-4' &&
      '[--base:var(--node-color-seq-4)] [--dark:var(--node-color-seq-4-dark)]',
    color === 'node-color-seq-5' &&
      '[--base:var(--node-color-seq-5)] [--dark:var(--node-color-seq-5-dark)]',
    color === 'node-color-seq-6' &&
      '[--base:var(--node-color-seq-6)] [--dark:var(--node-color-seq-6-dark)]',
    color === 'node-color-seq-7' &&
      '[--base:var(--node-color-seq-7)] [--dark:var(--node-color-seq-7-dark)]',
    color === 'node-color-seq-8' &&
      '[--base:var(--node-color-seq-8)] [--dark:var(--node-color-seq-8-dark)]',
    'bg-[linear-gradient(145deg,var(--base)_0%,var(--base)_50%,var(--dark)_50%,var(--dark)_100%)]',
    selected && 'border-7 border-selected',
    // Linking state uses the ::before pseudo-element
    linking &&
      'shadow-none border-5 border-selected before:content-[""] before:absolute before:-inset-4 before:-z-10 before:bg-selected before:rounded-full before:animate-linking before:origin-center before:opacity-50 before:shadow-lg',
  );

  const labelClasses = cx(
    'whitespace-pre-line overflow-hidden text-center hyphens-auto text-wrap break-all px-2',
    size === 'sm' ? 'text-sm' : 'text-base',
  );

  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  return (
    <button className={classes} ref={ref} aria-label={label} {...buttonProps}>
      {loading && <Loader2 className="animate-spin" size={24} />}
      {!loading && <span className={labelClasses}>{labelWithEllipsis}</span>}
    </button>
  );
});

Node.displayName = 'Node';

export default Node;
