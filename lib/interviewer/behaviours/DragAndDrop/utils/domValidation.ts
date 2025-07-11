// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDOMElement = (element: any): element is HTMLElement => {
  return (
    element !== null &&
    element !== undefined &&
    typeof element === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    element.nodeType === Node.ELEMENT_NODE &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof element.getBoundingClientRect === 'function' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof element.addEventListener === 'function'
  );
};

export const validateElementRef = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elementRef: React.RefObject<any>,
  componentName: string,
): HTMLElement | null => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const element = elementRef.current;

  if (!element) {
    // eslint-disable-next-line no-console
    console.warn(`${componentName}: elementRef.current is null`);
    return null;
  }

  if (!isDOMElement(element)) {
    // eslint-disable-next-line no-console
    console.error(
      `${componentName}: elementRef.current is not a DOM element. ` +
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Got: ${typeof element}, nodeType: ${element?.nodeType}. ` +
        `Make sure the ref is attached to a DOM element, not a React component.`,
    );
    return null;
  }

  return element;
};

export const assertDOMElement = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  context: string,
): HTMLElement => {
  if (!isDOMElement(element)) {
    throw new Error(
      `${context}: Expected DOM element but got ${typeof element}. ` +
        `Make sure you're passing a valid HTML element.`,
    );
  }
  return element;
};