import { Loader2 } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '~/utils/shadcn';

export const NodeColors = [
  'node-color-seq-1',
  'node-color-seq-2',
  'node-color-seq-3',
  'node-color-seq-4',
  'node-color-seq-5',
  'node-color-seq-6',
  'node-color-seq-7',
  'node-color-seq-8',
  'custom',
] as const;

export type NodeColorSequence = (typeof NodeColors)[number];

type UINodeProps = {
  color?: NodeColorSequence;
  shape?: 'circle' | 'square';
  label?: string;
  /** Accessibility label for the node button. Falls back to `label` if not provided. */
  ariaLabel?: string;
  selected?: boolean;
  linking?: boolean;
  loading?: boolean;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
} & Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & {
    disabled?: boolean;
  };

/**
 * Renders a Node.
 */
const Node = forwardRef<HTMLButtonElement, UINodeProps>((props, ref) => {
  const {
    label = 'Node',
    ariaLabel,
    color = 'node-color-seq-1',
    shape = 'circle',
    selected = false,
    linking = false,
    loading = false,
    size = 'md',
    className,
    ...buttonProps
  } = props;
  const classes = cn(
    'inline-flex items-center justify-center shadow-lg relative transition-all duration-300',
    'disabled:saturate-50 disabled:cursor-not-allowed',
    'text-white font-semibold',
    shape === 'square' ? 'rounded-md' : 'rounded-full',
    // Responsive node sizes - scale with viewport width
    size === 'xxs' &&
      'h-[var(--node-size-xxs)] w-[var(--node-size-xxs)] text-[length:var(--node-font-size-xxs)]',
    size === 'xs' &&
      'h-[var(--node-size-xs)] w-[var(--node-size-xs)] text-[length:var(--node-font-size-xs)]',
    size === 'sm' &&
      'h-[var(--node-size-sm)] w-[var(--node-size-sm)] text-[length:var(--node-font-size-sm)]',
    size === 'md' &&
      'h-[var(--node-size-md)] w-[var(--node-size-md)] text-[length:var(--node-font-size-md)]',
    size === 'lg' &&
      'h-[var(--node-size-lg)] w-[var(--node-size-lg)] text-[length:var(--node-font-size-lg)]',
    // Color CSS custom properties - default to seq-1 for 'custom' color
    (color === 'node-color-seq-1' || color === 'custom') &&
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
    selected && 'border-4 border-white ring-6 ring-white/25',
    // Linking state uses the ::before pseudo-element
    linking &&
      'shadow-none border-5 border-white before:content-[""] before:absolute before:-inset-4 before:-z-10 before:bg-white/25 before:rounded-full before:animate-linking before:origin-center before:opacity-50 before:shadow-lg',
    className,
  );

  const labelClasses = cn(
    'whitespace-pre-line overflow-hidden text-center hyphens-auto text-wrap break-all px-2',
  );

  // Size-aware label truncation - smaller nodes get shorter labels
  const maxLabelLength: Record<NonNullable<UINodeProps['size']>, number> = {
    xxs: 8,
    xs: 12,
    sm: 16,
    md: 22,
    lg: 28,
  };
  const maxChars = maxLabelLength[size];
  const labelWithEllipsis =
    label.length <= maxChars ? label : `${label.substring(0, maxChars - 3)}\u{AD}...`;

  return (
    <button className={classes} ref={ref} {...buttonProps} aria-label={ariaLabel ?? label}>
      {loading && <Loader2 className="animate-spin" size={24} />}
      {!loading && <span className={labelClasses}>{labelWithEllipsis}</span>}
    </button>
  );
});

Node.displayName = 'Node';

export default Node;
