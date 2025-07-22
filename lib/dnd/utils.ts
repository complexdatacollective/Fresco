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

// Get absolute position accounting for scroll and transforms
export function getAbsolutePosition(element: HTMLElement): {
  x: number;
  y: number;
} {
  const rect = element.getBoundingClientRect();
  const scrollLeft = window.pageXOffset ?? document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset ?? document.documentElement.scrollTop;

  return {
    x: rect.left + scrollLeft,
    y: rect.top + scrollTop,
  };
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

// Check if element is scrollable
export function isScrollable(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const overflow = style.overflow + style.overflowX + style.overflowY;
  return overflow.includes('auto') || overflow.includes('scroll');
}

// Find scrollable parent
export function findScrollableParent(
  element: HTMLElement | null,
): HTMLElement | null {
  if (!element) return null;

  let parent = element.parentElement;
  while (parent) {
    if (isScrollable(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
}

// Auto-scroll when dragging near edges
export function autoScroll(
  container: HTMLElement,
  pointerX: number,
  pointerY: number,
  scrollSpeed = 10,
): void {
  const rect = container.getBoundingClientRect();
  const threshold = 50; // pixels from edge to trigger scroll

  let scrollX = 0;
  let scrollY = 0;

  // Check horizontal scroll
  if (pointerX < rect.left + threshold) {
    scrollX = -scrollSpeed;
  } else if (pointerX > rect.right - threshold) {
    scrollX = scrollSpeed;
  }

  // Check vertical scroll
  if (pointerY < rect.top + threshold) {
    scrollY = -scrollSpeed;
  } else if (pointerY > rect.bottom - threshold) {
    scrollY = scrollSpeed;
  }

  if (scrollX !== 0 || scrollY !== 0) {
    container.scrollBy({ left: scrollX, top: scrollY, behavior: 'instant' });
  }
}

// Create a unique ID
let idCounter = 0;
export function createUniqueId(prefix = 'dnd'): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// Debounce with immediate option
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn(...args);
      }
    }, delay);

    if (callNow) {
      fn(...args);
    }
  };
}

export const findSourceZone = (element: HTMLElement | null): string | null => {
  // Find the closest parent with the data-zone-id attribute (used by drop targets)
  const sourceZoneElement = element?.closest('[data-zone-id]');

  // Return the attribute's value, or null if not found
  return sourceZoneElement?.getAttribute('data-zone-id') ?? null;
};
