'use client';

import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type CSSProperties,
} from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import { useNodeInteractions } from '~/hooks/useNodeInteractions';
import usePrevious from '~/hooks/usePrevious';
import { composeEventHandlers } from '~/utils/composeEventHandlers';
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
    'focusable relative inline-flex items-center justify-center outline-offset-6',
    'aspect-square',
    'text-white',
    '[--base:var(--node-1)] [--dark:oklch(from_var(--base)_calc(l-0.05)_c_h)]',
    'bg-[linear-gradient(145deg,var(--base)_0%,var(--base)_50%,var(--dark)_50%,var(--dark)_100%)]',
  ],
  variants: {
    size: {
      xxs: 'size-8',
      xs: 'size-18',
      sm: 'size-24',
      md: 'size-30',
      lg: 'size-36',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded',
    },
    color: {
      'node-color-seq-1': 'outline-node-1 [--base:var(--color-node-1)]',
      'node-color-seq-2': 'outline-node-2 [--base:var(--color-node-2)]',
      'node-color-seq-3': 'outline-node-3 [--base:var(--color-node-3)]',
      'node-color-seq-4': 'outline-node-4 [--base:var(--color-node-4)]',
      'node-color-seq-5': 'outline-node-5 [--base:var(--color-node-5)]',
      'node-color-seq-6': 'outline-node-6 [--base:var(--color-node-6)]',
      'node-color-seq-7': 'outline-node-7 [--base:var(--color-node-7)]',
      'node-color-seq-8': 'outline-node-8 [--base:var(--color-node-8)]',
      'custom': '', // Custom color - set via style prop
    },
    disabled: {
      true: 'pointer-events-none saturate-50',
      false: '',
    },
  },
  compoundVariants: [],
  defaultVariants: {
    size: 'md',
    shape: 'circle',
    color: 'node-color-seq-1',
    disabled: false,
  },
});

const labelVariants = cva({
  base: [
    'overflow-hidden text-center hyphens-auto whitespace-pre-line',
    'px-2 text-wrap wrap-break-word',
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
  /** Text label displayed inside the node */
  label?: string;
  /** Whether the node is loading */
  loading?: boolean;
  /** Whether the node is selected (toggle state) */
  selected?: boolean;
  /** Whether the node is in linking mode (externally controlled) */
  linking?: boolean;
  /** Whether the node is highlighted (e.g. via highlight behavior) */
  highlighted?: boolean;
  /** External pointer down handler (composes with internal behavior) */
  onPointerDown?: (e: React.PointerEvent) => void;
  /** External pointer up handler (composes with internal behavior) */
  onPointerUp?: (e: React.PointerEvent) => void;
} & VariantProps<typeof nodeVariants> &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | 'color'
    | 'onPointerDown'
    | 'onPointerUp'
    | 'onDrag'
    | 'onDragStart'
    | 'onDragEnd'
    | 'onAnimationStart'
    | 'onAnimationEnd'
  >;

/**
 * Renders a Node - the fundamental representation of an entity in Network Canvas.
 *
 * Visual states:
 * - Focus: outline ring (via focusable utility)
 * - Selected: box-shadow ring with spring animation (on main element)
 * - Linking: pulsing box-shadow ring (separate layer, can be active with selected)
 * - Disabled: desaturated, no pointer events
 *
 * Interaction behaviors are inferred from props:
 * - onClick present: enables press animation, sets pointer cursor
 * - style.cursor provided: uses that cursor (e.g., 'grab' from drag systems)
 *
 * Label behavior:
 * - Text is truncated with ellipsis if too long, but supports multi-line with breaks
 * - Uses RenderMarkdown to allow basic formatting in labels
 *
 * Shapes:
 * - Circle (default) or square, controlled by shape prop
 */
const Node = forwardRef<HTMLButtonElement, UINodeProps>((props, ref) => {
  const {
    label = 'Node',
    color,
    shape,
    selected = false,
    linking = false,
    highlighted = false,
    loading = false,
    disabled = false,
    size = 'md',
    className,
    style,
    onPointerDown: externalPointerDown,
    onPointerUp: externalPointerUp,
    onClick,
    ...buttonProps
  } = props;

  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`;

  // Infer interaction mode from props
  const hasClickHandler = !!onClick;

  // Determine cursor: external style takes precedence, then infer from props
  const cursor: CSSProperties['cursor'] = disabled
    ? 'not-allowed'
    : (style?.cursor ?? (hasClickHandler ? 'pointer' : 'default'));

  // Use the interaction hook for press animation
  const { scope, nodeProps } = useNodeInteractions({
    hasClickHandler,
    disabled,
  });

  // Scope for selected state animation (box-shadow on main element)
  const [stateScope, animate] = useAnimate();

  // Track previous states for animation transitions
  const prevSelected = usePrevious(selected);
  const prevHighlighted = usePrevious(highlighted);

  // Box-shadow animation for selected and highlighted states
  useEffect(() => {
    if (!stateScope.current) return;

    const isActive = selected || highlighted;
    const wasActive = prevSelected === true || prevHighlighted === true;

    if (isActive && !wasActive) {
      // Spring animation - overshoots then rebounds to resting state
      void animate(
        stateScope.current,
        {
          boxShadow: [
            '0 0 0 0 var(--color-selected)',
            '0 0 0 0.5em var(--color-selected)',
            '0 0 0 0.3em var(--color-selected)',
          ],
        },
        {
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1],
        },
      );
    } else if (!isActive && wasActive) {
      void animate(
        stateScope.current,
        { boxShadow: '0 0 0 0 transparent' },
        { duration: 0.15 },
      );
    }
  }, [
    selected,
    highlighted,
    prevSelected,
    prevHighlighted,
    stateScope,
    animate,
  ]);

  return (
    <motion.button
      ref={useMergeRefs({ ref, scope, stateScope })}
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={hasClickHandler ? selected : undefined}
      className={nodeVariants({
        size,
        shape,
        color,
        disabled,
        className,
      })}
      style={{
        ...nodeProps.style,
        ...style,
        cursor,
      }}
      data-node-selected={selected || undefined}
      data-node-linking={linking || undefined}
      data-node-highlighted={highlighted || undefined}
      onPointerDown={composeEventHandlers(
        nodeProps.onPointerDown,
        externalPointerDown,
      )}
      onPointerUp={composeEventHandlers(
        nodeProps.onPointerUp,
        externalPointerUp,
      )}
      onPointerCancel={nodeProps.onPointerCancel}
      onPointerLeave={nodeProps.onPointerLeave}
      onKeyDown={nodeProps.onKeyDown}
      onKeyUp={nodeProps.onKeyUp}
      onClick={onClick}
      {...buttonProps}
    >
      {/* Linking indicator - separate element so it can animate independently */}
      <AnimatePresence>
        {linking && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            initial={{
              boxShadow: '0 0 0 0.08em var(--color-selected)',
              opacity: 0.6,
            }}
            animate={{
              boxShadow: [
                '0 0 0 0.08em var(--color-selected)',
                '0 0 0 0.7em var(--color-selected)',
              ],
            }}
            exit={{ opacity: 0, boxShadow: '0 0 0 0 var(--color-selected)' }}
            transition={{
              boxShadow: {
                duration: 0.4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: [0.2, 0, 0.6, 1],
              },
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      {loading && <Loader2 className="animate-spin" size={24} />}
      {!loading && (
        <span className={labelVariants({ size, className: 'leading-5' })}>
          {labelWithEllipsis}
        </span>
      )}
    </motion.button>
  );
});

Node.displayName = 'Node';

export default Node;
