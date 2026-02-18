import { stagger, useAnimate } from 'motion/react';
import { useEffect, useRef } from 'react';

const TOTAL_STAGGER_DURATION = 0.8;
const MAX_STAGGER_DELAY = 0.1;

/**
 * Runs a one-time stagger entrance animation on mount.
 * Targets all `[data-stagger-item]` descendants within the scoped element.
 *
 * The per-item stagger delay is calculated as `TOTAL_STAGGER_DURATION / itemCount`,
 * clamped to a maximum of `MAX_STAGGER_DELAY`.
 *
 * @param enabled - Whether animation is enabled
 * @param itemCount - Number of items to animate (used to calculate stagger delay)
 * @returns A ref to attach to the animation scope container
 */
export function useStaggerAnimation(enabled: boolean, itemCount: number) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasAnimatedRef.current || itemCount === 0) {
      return;
    }

    hasAnimatedRef.current = true;

    const staggerDelay = Math.min(
      TOTAL_STAGGER_DURATION / itemCount,
      MAX_STAGGER_DELAY,
    );

    const runAnimation = async () => {
      await animate(
        '[data-stagger-item]',
        { opacity: [0, 1], y: ['20%', '0%'], scale: [0.6, 1] },
        {
          type: 'spring',
          stiffness: 500,
          damping: 20,
          delay: stagger(staggerDelay),
        },
      );
    };

    void runAnimation();
  }, [animate, enabled, itemCount]);

  return scope;
}
