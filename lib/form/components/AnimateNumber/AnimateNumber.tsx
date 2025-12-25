'use client';

import {
  easeOut,
  LayoutGroup,
  motion,
  MotionConfig,
  MotionConfigContext,
  type HTMLMotionProps,
} from 'motion/react';
import {
  forwardRef,
  useContext,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
} from 'react';
import { DirectionContext, type AnimationDirection } from './DirectionContext';
import { Mask, maskHeight } from './Mask';
import { NumberSection } from './NumberSection';
import { formatToParts } from './utils/formatParts';

const DEFAULT_TRANSITION = {
  opacity: { duration: 1, ease: easeOut },
  layout: { type: 'spring', duration: 1, bounce: 0 },
  y: { type: 'spring', duration: 1, bounce: 0 },
} as const;

export type AnimateNumberProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: number | bigint | string;
  locales?: Intl.LocalesArgument;
  format?: Omit<Intl.NumberFormatOptions, 'notation'> & {
    notation?: Exclude<
      Intl.NumberFormatOptions['notation'],
      'scientific' | 'engineering'
    >;
  };
  transition?: ComponentProps<typeof MotionConfig>['transition'];
  suffix?: string;
  prefix?: string;
  /**
   * Controls the animation direction for digit rollovers.
   * - 'up': Digits animate upward (for incrementing values)
   * - 'down': Digits animate downward (for decrementing values)
   * - 'auto': Uses shortest path (original behavior)
   */
  direction?: AnimationDirection;
};

export const AnimateNumber = forwardRef<HTMLDivElement, AnimateNumberProps>(
  function AnimateNumber(
    {
      children: value,
      locales,
      format,
      transition,
      style,
      suffix,
      prefix,
      direction = 'auto',
      ...rest
    },
    ref,
  ) {
    const parts = useMemo(
      () => formatToParts(value, { locales, format }, prefix, suffix),
      [value, locales, format, prefix, suffix],
    );
    const { pre, integer, fraction, post, formatted } = parts;

    const contextTransition = useContext(MotionConfigContext).transition;
    const resolvedTransition =
      transition ?? contextTransition ?? DEFAULT_TRANSITION;

    const { layoutDependency } = rest as { layoutDependency?: unknown };
    const dependency = useMemo(() => {
      if (layoutDependency === undefined) return undefined;
      return { layoutDependency, value };
    }, [layoutDependency, value]);

    // Auto-detect direction based on value changes
    const prevValue = useRef<number | bigint | string>(value);
    const computedDirection = useMemo(() => {
      if (direction !== 'auto') return direction;

      const numValue = Number(value);
      const numPrev = Number(prevValue.current);
      prevValue.current = value;

      // Use simple value comparison for all numbers
      // For positive: 9→10 = up, 10→9 = down
      // For negative: -10→-9 = up (value increases), -9→-10 = down (value decreases)
      if (numValue > numPrev) return 'up';
      if (numValue < numPrev) return 'down';
      return 'auto';
    }, [value, direction]);

    return (
      <DirectionContext.Provider value={computedDirection}>
        <LayoutGroup>
          <MotionConfig transition={resolvedTransition}>
            <motion.div
              {...rest}
              ref={ref}
              layoutDependency={dependency}
              style={
                {
                  lineHeight: 1,
                  ...style,
                  display: 'inline-flex',
                  isolation: 'isolate',
                  whiteSpace: 'nowrap',
                } as CSSProperties
              }
            >
              <motion.div
                layoutDependency={dependency}
                aria-label={formatted}
                style={{
                  display: 'inline-flex',
                  direction: 'ltr',
                  isolation: 'isolate',
                  position: 'relative',
                  zIndex: -1,
                }}
              >
                <NumberSection
                  style={{ padding: `calc(${maskHeight}/2) 0` }}
                  layoutDependency={dependency}
                  aria-hidden
                  justify="right"
                  mode="popLayout"
                  parts={pre}
                  name="pre"
                />
                <Mask layoutDependency={dependency}>
                  <NumberSection
                    layoutDependency={dependency}
                    justify="right"
                    parts={integer}
                    name="integer"
                  />
                  <NumberSection
                    layout="position"
                    layoutDependency={dependency}
                    parts={fraction}
                    name="fraction"
                  />
                </Mask>
                <NumberSection
                  style={{ padding: `calc(${maskHeight}/2) 0` }}
                  aria-hidden
                  layout="position"
                  layoutDependency={dependency}
                  mode="popLayout"
                  parts={post}
                  name="post"
                />
              </motion.div>
            </motion.div>
          </MotionConfig>
        </LayoutGroup>
      </DirectionContext.Provider>
    );
  },
);
