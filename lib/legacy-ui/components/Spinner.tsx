'use client';

import { motion, useAnimationControls } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

const ANIMATION_DURATION = 1.8;

const spinnerColors = [
  {
    light: 'oklch(73.83% 0.13 217.55)', // sea-serpent
    dark: 'oklch(68.83% 0.13 217.55)', // sea-serpent-dark
  },
  {
    light: 'oklch(81% 0.17 86.39)', // mustard
    dark: 'oklch(76% 0.17 86.39)', // mustard-dark
  },
  {
    light: 'oklch(57.33% 0.2584 11.57)', // neon-coral
    dark: 'oklch(52.33% 0.2584 11.57)', // neon-coral-dark
  },
  {
    light: 'oklch(70% 0.2 171.52)', // sea-green
    dark: 'oklch(65% 0.2 171.52)', // sea-green-dark
  },
];

const circlePositions = [
  { top: -1, left: 0, rotate: 0 },
  { top: 0, left: 2, rotate: 90 },
  { top: 1, left: -1, rotate: -90 },
  { top: 2, left: 1, rotate: -180 },
];

const spinnerVariants = cva({
  base: [
    '[--container-size:calc(var(--circle-size)*3)]',
    'relative',
    'will-change-transform',
    'backface-visibility-hidden',
    'w-(--container-size)',
    'h-(--container-size)',
    'm-(--circle-size)',
  ],
  variants: {
    size: {
      xs: '[--circle-size:0.35rem]',
      sm: '[--circle-size:0.5rem]',
      md: '[--circle-size:0.75rem]',
      lg: '[--circle-size:1.25rem]',
      xl: '[--circle-size:2rem]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type AnimationMode =
  | 'infinite' // Always animating, loops forever (default)
  | 'hover' // Animate on hover, plays once per hover
  | 'once' // Play once on mount then stop
  | 'controlled'; // Control via isAnimating prop

type SpinnerProps = {
  /** Custom size value (e.g., "4rem") - overrides size variant */
  customSize?: string;
  /** Animation mode: 'infinite' (default), 'hover', 'once', or 'controlled' */
  animationMode?: AnimationMode;
  /** For 'controlled' mode: whether animation is currently playing */
  isAnimating?: boolean;
  /** Play one animation cycle on mount (can be combined with other modes like 'hover') */
  playOnMount?: boolean;
  className?: string;
} & VariantProps<typeof spinnerVariants>;

const halfCircleBase = [
  'h-(--circle-size)',
  'w-[calc(var(--circle-size)*2)]',
  'rounded-t-[calc(var(--circle-size)*2)]',
];

// Container animation keyframes and timing
const containerAnimation = {
  rotate: [45, 45, 405, 405],
  scale: [1, 0.8, 1, 1],
  transition: {
    rotate: {
      duration: ANIMATION_DURATION,
      ease: 'easeInOut' as const,
      times: [0, 0, 0.57, 1],
    },
    scale: {
      duration: ANIMATION_DURATION,
      ease: 'easeInOut' as const,
      times: [0, 0.2, 0.57, 1],
    },
  },
};

export default function Spinner({
  size = 'md',
  customSize,
  animationMode = 'infinite',
  isAnimating = true,
  playOnMount = false,
  className,
}: SpinnerProps) {
  const customSizeStyle = customSize
    ? ({ '--circle-size': customSize } as React.CSSProperties)
    : undefined;

  const shouldLoop = animationMode === 'infinite';
  const isControlled = animationMode === 'controlled';
  const isHoverMode = animationMode === 'hover';

  const containerControls = useAnimationControls();
  const halfCircleControls = [
    useAnimationControls(),
    useAnimationControls(),
    useAnimationControls(),
    useAnimationControls(),
  ];

  // Track if animation is currently running (for hover mode)
  const isAnimatingRef = useRef(false);

  // Run one animation cycle
  const runCycle = async () => {
    isAnimatingRef.current = true;
    const containerPromise = containerControls.start(containerAnimation);

    // Animate half-circles: merge then split
    halfCircleControls.forEach((ctrl, i) => {
      void ctrl.start({
        x: ['50%', '0%', '50%'],
        backgroundColor: [
          spinnerColors[i]!.dark,
          spinnerColors[i]!.light,
          spinnerColors[i]!.dark,
        ],
        transition: {
          duration: ANIMATION_DURATION,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.5, 1],
        },
      });
    });

    await containerPromise;
    isAnimatingRef.current = false;
  };

  // Handle playOnMount - runs once on mount
  useEffect(() => {
    if (playOnMount) {
      void runCycle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle automatic animation modes (infinite, once, controlled)
  useEffect(() => {
    // Skip if playOnMount will handle the initial animation and mode is 'once'
    if (playOnMount && animationMode === 'once') return;

    let isMounted = true;

    const shouldAnimate =
      animationMode === 'infinite' ||
      animationMode === 'once' ||
      (isControlled && isAnimating);

    const loop = async () => {
      while (isMounted && shouldAnimate) {
        await runCycle();
        if (!shouldLoop) break;
      }
    };

    if (shouldAnimate) {
      void loop();
    }

    return () => {
      isMounted = false;
      containerControls.stop();
      halfCircleControls.forEach((ctrl) => ctrl.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationMode, isAnimating, shouldLoop]);

  // Handle hover mode - play one full cycle (skip if already animating)
  const handleHoverStart = () => {
    if (!isHoverMode || isAnimatingRef.current) return;
    void runCycle();
  };

  return (
    <motion.div
      className={cx(spinnerVariants({ size }), className)}
      style={customSizeStyle}
      initial={{ rotate: 45, scale: 1 }}
      animate={containerControls}
      onHoverStart={handleHoverStart}
    >
      {circlePositions.map((pos, index) => {
        const colors = spinnerColors[index]!;

        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              top: `calc(var(--circle-size) * ${pos.top})`,
              left: `calc(var(--circle-size) * ${pos.left})`,
              rotate: pos.rotate || 0,
            }}
          >
            <motion.div
              className={cx(halfCircleBase)}
              initial={{ x: '50%', backgroundColor: colors.dark }}
              animate={halfCircleControls[index]}
            />
            <div
              className={cx(
                halfCircleBase,
                'rotate-180',
                'relative',
                '-top-px',
              )}
              style={{ backgroundColor: colors.light }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
