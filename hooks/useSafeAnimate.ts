'use client';

import {
  MotionConfigContext,
  useAnimate,
  useReducedMotionConfig,
  type AnimationScope,
} from 'motion/react';
import { useContext, useMemo } from 'react';

type AnimateFn<T extends Element> = ReturnType<typeof useAnimate<T>>[1];

/**
 * Drop-in replacement for Motion's `useAnimate` that respects
 * `MotionConfig.skipAnimations`. The imperative `useAnimate` API only
 * checks `reducedMotion`, not `skipAnimations`, so WAAPI animations
 * still fire (with instant timing) even when `skipAnimations` is true.
 * WebKit reports these zero-duration WAAPI animations via
 * `getAnimations()`, which breaks Playwright's element stability check.
 *
 * When skipping, the final keyframe values are applied directly to the
 * element's inline style so visual state (e.g. selected borders) still
 * renders correctly without creating WAAPI animations.
 */
export function useSafeAnimate<T extends Element = HTMLDivElement>() {
  const [scope, animate] = useAnimate<T>();
  const { skipAnimations } = useContext(MotionConfigContext);
  const shouldReduceMotion = useReducedMotionConfig();

  const shouldSkip = !!skipAnimations || !!shouldReduceMotion;

  const safeAnimate = useMemo(() => {
    if (!shouldSkip) return animate;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const voidFn = () => {};
    const noop = {
      stop: voidFn,
      cancel: voidFn,
      complete: voidFn,
      pause: voidFn,
      play: voidFn,
      then: (resolve?: () => void) => {
        resolve?.();
        return noop;
      },
      time: 0,
      speed: 1,
      startTime: null,
      state: 'finished' as const,
      duration: 0,
      attachTimeline: () => voidFn,
      flatten: voidFn,
    };

    // Identity values that have no visual effect but can force WebKit to
    // create GPU compositor layers, causing getBoundingClientRect() to
    // oscillate between frames (breaking Playwright's stability check).
    const IDENTITY_VALUES = new Set(['blur(0px)', 'none', '0', '0px', '0%']);
    const IDENTITY_PROPS = new Set(['scale', 'filter', 'opacity', 'transform']);

    return ((...args: Parameters<AnimateFn<T>>) => {
      const [elementOrSelector, keyframes] = args;

      if (
        elementOrSelector instanceof Element &&
        keyframes &&
        typeof keyframes === 'object' &&
        !Array.isArray(keyframes)
      ) {
        const el = elementOrSelector as HTMLElement;
        for (const [prop, value] of Object.entries(keyframes)) {
          const finalValue = Array.isArray(value)
            ? value[value.length - 1]
            : value;
          if (typeof finalValue !== 'string' && typeof finalValue !== 'number')
            continue;
          const strVal = String(finalValue);

          // Skip identity values on compositor-sensitive properties
          // to avoid WebKit bbox jitter on fixed/translated elements.
          if (IDENTITY_PROPS.has(prop) && IDENTITY_VALUES.has(strVal)) continue;
          if (IDENTITY_PROPS.has(prop) && Number(finalValue) === 1) continue;

          el.style.setProperty(
            prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
            strVal,
          );
        }
      }

      return noop;
    }) as unknown as AnimateFn<T>;
  }, [shouldSkip, animate]);

  return [scope, safeAnimate] as [AnimationScope<T>, AnimateFn<T>];
}
