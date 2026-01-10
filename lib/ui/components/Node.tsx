import { Loader2 } from 'lucide-react';
import { motion, useAnimate } from 'motion/react';
import { forwardRef, useEffect, type HTMLAttributes } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import usePrevious from '~/hooks/usePrevious';
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
    'aspect-square',
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
      true: 'outline-selected outline outline-offset-2',
      false: '',
    },
    linking: {
      true: 'outline-selected outline outline-offset-2',
      false: '',
    },
  },
  compoundVariants: [],
  defaultVariants: {
    size: 'md',
    shape: 'circle',
    color: 'node-color-seq-1',
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
  Omit<HTMLAttributes<typeof motion.button>, 'color'> & {
    disabled?: boolean;
  };

/**
 * Renders a Node.
 */
const Node = forwardRef<typeof motion.button, UINodeProps>((props, ref) => {
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

  // const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate();

  // useEffect(() => {
  //   if (isPresent) {
  //     const enterAnimation = async () => {
  //       await animate(scope.current, { opacity: [0, 1], y: ['20%', '0%'] });
  //     };
  //     void enterAnimation();
  //   } else {
  //     const exitAnimation = async () => {
  //       await animate(scope.current, { opacity: [1, 0], scale: [1, 0.6] });
  //       safeToRemove();
  //     };

  //     void exitAnimation();
  //   }
  // }, [isPresent, animate, scope, safeToRemove]);

  const prevSelected = usePrevious(selected);

  // When selected state changes from false to true, animate in the border
  // with a scale effect and spring animation
  useEffect(() => {
    if (selected && !prevSelected) {
      console.log('Node selected, animating');
      animate(
        scope.current,
        { outlineWidth: ['0.45em', '0.2em'] },
        {
          type: 'spring',
          stiffness: 700,
          damping: 20,
        },
      );
    }
  }, [selected, prevSelected, animate, scope]);

  const prevLinking = usePrevious(linking);

  // When the linking state changes from false to true, animate in the linking effect
  useEffect(() => {
    if (linking && !prevLinking) {
      console.log('Node linking, animating');
      animate(
        scope.current,
        {
          outlineWidth: ['0.8em', '0.1em', '0.8em'],
        },
        { duration: 0.75, repeat: Infinity },
      );
    }
  }, [linking, prevLinking, animate, scope]);

  return (
    <motion.button
      ref={useMergeRefs({ ref, scope })}
      className={nodeVariants({
        size,
        shape,
        color,
        selected,
        linking,
        // className,
      })}
      // ref={scope}
      aria-label={label}
      {...buttonProps}
      onPointerDown={() => {
        animate(scope.current, { scale: 0.85 });
      }}
      onPointerUp={() => {
        animate(
          scope.current,
          {
            scale: 1,
          },
          { type: 'spring', stiffness: 700, damping: 20 },
        );
      }}
    >
      {loading && <Loader2 className="animate-spin" size={24} />}
      {!loading && (
        <span className={labelVariants({ size })}>{labelWithEllipsis}</span>
      )}
    </motion.button>
  );
});

Node.displayName = 'Node';

export default Node;
