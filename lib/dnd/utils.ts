// Performance utilities for drag and drop

// Throttle function using requestAnimationFrame
export function rafThrottle<TArgs extends readonly unknown[], TReturn = void>(
  fn: (...args: TArgs) => TReturn,
): ((...args: TArgs) => void) & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: TArgs | null = null;

  const throttled = (...args: TArgs) => {
    lastArgs = args;

    rafId ??= requestAnimationFrame(() => {
      if (lastArgs !== null) {
        fn(...lastArgs);
      }
      rafId = null;
    });
  };

  // Add cancel method
  const throttledWithCancel = throttled as typeof throttled & {
    cancel: () => void;
  };
  throttledWithCancel.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttledWithCancel;
}



// Get element bounds with transform support (viewport coordinates)
export function getElementBounds(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export const findSourceZone = (element: HTMLElement | null): string | null => {
  // Find the closest parent with the data-zone-id attribute (used by drop targets)
  const sourceZoneElement = element?.closest('[data-zone-id]');

  // Return the attribute's value, or null if not found
  return sourceZoneElement?.getAttribute('data-zone-id') ?? null;
};
