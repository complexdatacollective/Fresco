'use client';

import { useContext, useMemo } from 'react';
import {
  MotionConfigContext,
  useAnimate,
  useReducedMotionConfig,
  type AnimationScope,
} from 'motion/react';

type AnimateFn<T extends Element> = ReturnType<typeof useAnimate<T>>[1];

/**
 * Drop-in replacement for Motion's `useAnimate` that respects
 * `MotionConfig.skipAnimations`. The imperative `useAnimate` API only
 * checks `reducedMotion`, not `skipAnimations`, so WAAPI animations
 * still fire (with instant timing) even when `skipAnimations` is true.
 * WebKit reports these zero-duration WAAPI animations via
 * `getAnimations()`, which breaks Playwright's element stability check.
 *
 * This wrapper returns a no-op `animate` that resolves immediately when
 * either `skipAnimations` is true or reduced motion is active.
 */
export function useSafeAnimate<T extends Element = HTMLDivElement>() {
  const [scope, animate] = useAnimate<T>();
  const { skipAnimations } = useContext(MotionConfigContext);
  const shouldReduceMotion = useReducedMotionConfig();

  const shouldSkip = !!skipAnimations || !!shouldReduceMotion;

  const safeAnimate = useMemo(() => {
    if (!shouldSkip) return animate;

    const noop = {
      stop: () => {},
      cancel: () => {},
      complete: () => {},
      pause: () => {},
      play: () => {},
      then: (resolve?: () => void) => {
        resolve?.();
        return noop;
      },
      time: 0,
      speed: 1,
      startTime: null,
      state: 'finished' as const,
      duration: 0,
      attachTimeline: () => () => {},
      flatten: () => {},
    };

    return ((..._args: Parameters<AnimateFn<T>>) =>
      noop) as unknown as AnimateFn<T>;
  }, [shouldSkip, animate]);

  return [scope, safeAnimate] as [AnimationScope<T>, AnimateFn<T>];
}
