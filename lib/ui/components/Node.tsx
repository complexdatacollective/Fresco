import { Loader2 } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from '~/utils/cva';

// TODO: should be part of protocol-validation
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

const nodeVariants = cva({
  base: [
    'focusable relative inline-flex items-center justify-center shadow-xl',
    'aspect-square transition-colors duration-300',
    'disabled:cursor-not-allowed disabled:saturate-50',
    'text-white',
    '[--base:var(--node-1)] [--dark:oklch(from_var(--base)_calc(l-0.05)_c_h)]',
    'bg-[linear-gradient(145deg,var(--base)_0%,var(--base)_50%,var(--dark)_50%,var(--dark)_100%)]',
  ],
  variants: {
    size: {
      xxs: 'h-8 w-8',
      xs: 'h-16 w-16',
      sm: 'h-20 w-20',
      md: 'h-26 w-26',
      lg: 'h-32 w-32',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded',
    },
    color: {
      'node-color-seq-1': 'outline-node-1! [--base:var(--color-node-1)]',
      'node-color-seq-2': 'outline-node-2! [--base:var(--color-node-2)]',
      'node-color-seq-3': 'outline-node-3! [--base:var(--color-node-3)]',
      'node-color-seq-4': 'outline-node-4! [--base:var(--color-node-4)]',
      'node-color-seq-5': 'outline-node-5! [--base:var(--color-node-5)]',
      'node-color-seq-6': 'outline-node-6! [--base:var(--color-node-6)]',
      'node-color-seq-7': 'outline-node-7! [--base:var(--color-node-7)]',
      'node-color-seq-8': 'outline-node-8! [--base:var(--color-node-8)]',
    },
    selected: {
      true: 'border-selected border-[0.25em]',
      false: '',
    },
    linking: {
      true: [
        'border-selected shadow-none',
        'before:absolute before:-inset-4 before:-z-10 before:content-[""]',
        'before:bg-selected before:animate-linking before:rounded-full',
        'before:origin-center before:opacity-50 before:shadow-lg',
      ],
      false: '',
    },
  },
  compoundVariants: [],
  defaultVariants: {
    size: 'md',
    shape: 'circle',
    color: 'node-color-seq-1',
    selected: false,
    linking: false,
  },
});

const labelVariants = cva({
  base: [
    'overflow-hidden text-center hyphens-auto whitespace-pre-line',
    'px-2 text-wrap break-all',
  ],
  variants: {
    size: {
      xxs: 'text-xs',
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type UINodeProps = {
  label?: string;
  loading?: boolean;
} & VariantProps<typeof nodeVariants> &
  Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & {
    disabled?: boolean;
  };

/**
 * Renders a Node.
 */
const Node = forwardRef<HTMLButtonElement, UINodeProps>((props, ref) => {
  const {
    label = 'Node',
    color,
    shape,
    selected,
    linking,
    loading = false,
    size = 'md',
    className,
    ...buttonProps
  } = props;

  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  return (
    <button
      className={nodeVariants({ size, shape, color, selected, linking })}
      ref={ref}
      aria-label={label}
      {...buttonProps}
    >
      {loading && <Loader2 className="animate-spin" size={24} />}
      {!loading && (
        <span className={labelVariants({ size })}>{labelWithEllipsis}</span>
      )}
    </button>
  );
});

Node.displayName = 'Node';

export default Node;
