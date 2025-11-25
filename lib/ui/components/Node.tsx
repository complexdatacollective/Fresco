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
    'focusable inline-flex items-center justify-center shadow-xl relative',
    'transition-all duration-300 aspect-square',
    'disabled:saturate-50 disabled:cursor-not-allowed',
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
      'circle': 'rounded-full',
      'square': 'rounded',
      'star':
        '[clip-path:polygon(100%_50%,75.98%_65%,75%_93.3%,50%_80%,25%_93.3%,24.02%_65%,0%_50%,24.02%_35%,25%_6.7%,50%_20%,75%_6.7%,75.98%_35%)]',
      'triangle': '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
      // --g:/20.56% 20.56% radial-gradient(#000 calc(71% - 1px),#0000 71%) no-repeat;
      // mask: 100% 50% var(--g),93.301% 75% var(--g),75% 93.301% var(--g),50% 100% var(--g),25% 93.301% var(--g),6.699% 75% var(--g),0% 50% var(--g),6.699% 25% var(--g),25% 6.699% var(--g),50% 0% var(--g),75% 6.699% var(--g),93.301% 25% var(--g),radial-gradient(100% 100%,#000 38.366%,#0000 calc(38.366% + 1px));
      'flower':
        '[clip-path:polygon(50%_0%,61.8%_17.6%,80.9%_20.6%,67.6%_34.4%,71.6%_53.4%,50%_44.1%,28.4%_53.4%,32.4%_34.4%,19.1%_20.6%,38.2%_17.6%)]',
      // clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%);
      'rhombus': '[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]',
      //   aspect-ratio: 1/cos(30deg);
      // clip-path: polygon(50% -50%,100% 50%,50% 150%,0 50%);
      'hexagon':
        'aspect-[1/cos(30deg)] [clip-path:polygon(50%_-50%,100%_50%,50%_150%,0_50%)]',
      //   --o:calc(50%*tan(-22.5deg));
      //clip-path: polygon(
      //  var(--o) 50%,
      //  50% var(--o),
      //  calc(100% - var(--o)) 50%,
      //  50% calc(100% - var(--o))
      //);
      'octagon':
        '[--o:calc(50%*tan(-22.5deg))] [clip-path:polygon(var(--o)_50%,50%_var(--o),calc(100%-var(--o))_50%,50%_calc(100%-var(--o)))]',
      'scooped-corners': '',
      'inner-notch': '',
      'heart':
        '[mask:radial-gradient(at_50%_25%,#000_0%,#000_25%,#0000_26%)_left_50%_no-repeat,radial-gradient(at_50%_25%,#000_0%,#000_25%,#0000_26%)_right_50%_no-repeat,conic-gradient(#000_0_0)_bottom/100%_50%_no-repeat]',
    },
    color: {
      'node-color-seq-1': '[--base:var(--color-node-1)]',
      'node-color-seq-2': '[--base:var(--color-node-2)]',
      'node-color-seq-3': '[--base:var(--color-node-3)]',
      'node-color-seq-4': '[--base:var(--color-node-4)]',
      'node-color-seq-5': '[--base:var(--color-node-5)]',
      'node-color-seq-6': '[--base:var(--color-node-6)]',
      'node-color-seq-7': '[--base:var(--color-node-7)]',
      'node-color-seq-8': '[--base:var(--color-node-8)]',
    },
    selected: {
      true: 'border-selected',
      false: '',
    },
    linking: {
      true: [
        'shadow-none border-selected',
        'before:content-[""] before:absolute before:-inset-4 before:-z-10',
        'before:bg-selected before:rounded-full before:animate-linking',
        'before:origin-center before:opacity-50 before:shadow-lg',
      ],
      false: '',
    },
  },
  compoundVariants: [
    // Selected borders for circle and square (use actual borders)
    { size: 'xxs', shape: 'circle', selected: true, class: 'border-2' },
    { size: 'xs', shape: 'circle', selected: true, class: 'border-3' },
    { size: 'sm', shape: 'circle', selected: true, class: 'border-4' },
    { size: 'md', shape: 'circle', selected: true, class: 'border-5' },
    { size: 'lg', shape: 'circle', selected: true, class: 'border-7' },
    { size: 'xxs', shape: 'square', selected: true, class: 'border-2' },
    { size: 'xs', shape: 'square', selected: true, class: 'border-3' },
    { size: 'sm', shape: 'square', selected: true, class: 'border-4' },
    { size: 'md', shape: 'square', selected: true, class: 'border-5' },
    { size: 'lg', shape: 'square', selected: true, class: 'border-7' },

    // Selected drop-shadow for clipped shapes (star, triangle, flower, rhombus, hexagon, octagon, heart)
    {
      size: 'xxs',
      shape: 'star',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'star',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'star',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'star',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'star',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'triangle',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'triangle',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'triangle',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'triangle',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'triangle',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'flower',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'flower',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'flower',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'flower',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'flower',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'rhombus',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'rhombus',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'rhombus',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'rhombus',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'rhombus',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'hexagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'hexagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'hexagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'hexagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'hexagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'octagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'octagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'octagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'octagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'octagon',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'heart',
      selected: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'heart',
      selected: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'heart',
      selected: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'heart',
      selected: true,
      class: 'drop-shadow-[0_0_0_5px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'heart',
      selected: true,
      class: 'drop-shadow-[0_0_0_7px_var(--color-selected)]',
    },

    // Linking borders for circle and square
    { size: 'xxs', shape: 'circle', linking: true, class: 'border' },
    { size: 'xs', shape: 'circle', linking: true, class: 'border-2' },
    { size: 'sm', shape: 'circle', linking: true, class: 'border-2' },
    { size: 'md', shape: 'circle', linking: true, class: 'border-3' },
    { size: 'lg', shape: 'circle', linking: true, class: 'border-4' },
    { size: 'xxs', shape: 'square', linking: true, class: 'border' },
    { size: 'xs', shape: 'square', linking: true, class: 'border-2' },
    { size: 'sm', shape: 'square', linking: true, class: 'border-2' },
    { size: 'md', shape: 'square', linking: true, class: 'border-3' },
    { size: 'lg', shape: 'square', linking: true, class: 'border-4' },

    // Linking drop-shadow for clipped shapes
    {
      size: 'xxs',
      shape: 'star',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'star',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'star',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'star',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'star',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'triangle',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'triangle',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'triangle',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'triangle',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'triangle',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'flower',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'flower',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'flower',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'flower',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'flower',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'rhombus',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'rhombus',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'rhombus',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'rhombus',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'rhombus',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'hexagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'hexagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'hexagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'hexagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'hexagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'octagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'octagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'octagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'octagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'octagon',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
    {
      size: 'xxs',
      shape: 'heart',
      linking: true,
      class: 'drop-shadow-[0_0_0_1px_var(--color-selected)]',
    },
    {
      size: 'xs',
      shape: 'heart',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'sm',
      shape: 'heart',
      linking: true,
      class: 'drop-shadow-[0_0_0_2px_var(--color-selected)]',
    },
    {
      size: 'md',
      shape: 'heart',
      linking: true,
      class: 'drop-shadow-[0_0_0_3px_var(--color-selected)]',
    },
    {
      size: 'lg',
      shape: 'heart',
      linking: true,
      class: 'drop-shadow-[0_0_0_4px_var(--color-selected)]',
    },
  ],
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
    'whitespace-pre-line overflow-hidden text-center hyphens-auto',
    'text-wrap break-all px-2',
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
