/**
 * Returns absolute coordinates and dimensions for an HTML element, corrected for all scroll positions.
 * Unlike getBoundingClientRect(), this returns coordinates relative to the entire document rather than
 * the viewport.
 *
 * @param element - The HTML element to measure
 * @returns Absolute coordinates and dimensions, or null if no valid element provided
 */
type AbsoluteRect = {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
};

export default function getAbsoluteBoundingRect(
  element: unknown,
): AbsoluteRect | null {
  // Type guard to check if element is valid
  if (!isValidElement(element)) {
    return null;
  }

  // Get initial rect from the element
  const rect = element.getBoundingClientRect();

  // Get document scroll position, using fallbacks for older browsers
  const documentScrollPosition = {
    x:
      window.scrollX ??
      window.pageXOffset ??
      document.documentElement.scrollLeft ??
      0,
    y:
      window.scrollY ??
      window.pageYOffset ??
      document.documentElement.scrollTop ??
      0,
  };

  // If the element is the body, we can return early with just the document scroll offset
  if (element === document.body) {
    return {
      bottom: rect.bottom + documentScrollPosition.y,
      height: rect.height,
      left: rect.left + documentScrollPosition.x,
      right: rect.right + documentScrollPosition.x,
      top: rect.top + documentScrollPosition.y,
      width: rect.width,
    };
  }

  // Calculate cumulative scroll offset from all scrollable parents
  const scrollOffset = getScrollOffsetFromParents(element);

  // Return absolute coordinates and dimensions
  return {
    bottom: rect.bottom + documentScrollPosition.y + scrollOffset.y,
    height: rect.height,
    left: rect.left + documentScrollPosition.x + scrollOffset.x,
    right: rect.right + documentScrollPosition.x + scrollOffset.x,
    top: rect.top + documentScrollPosition.y + scrollOffset.y,
    width: rect.width,
  };
}

/**
 * Type guard to check if the provided value is a valid Element
 */
function isValidElement(element: unknown): element is Element {
  return (
    element instanceof Element &&
    typeof element.getBoundingClientRect === 'function' &&
    element.nodeType === Node.ELEMENT_NODE
  );
}

/**
 * Calculates the cumulative scroll offset from all scrollable parent elements
 */
function getScrollOffsetFromParents(element: Element): {
  x: number;
  y: number;
} {
  let offsetX = 0;
  let offsetY = 0;
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    offsetX += parent.scrollLeft;
    offsetY += parent.scrollTop;
    parent = parent.parentElement;
  }

  return { x: offsetX, y: offsetY };
}
