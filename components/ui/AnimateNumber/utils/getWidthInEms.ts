export function getWidthInEm(element: Element): string {
  const { width, fontSize } = getComputedStyle(element);
  return `${parseFloat(width) / parseFloat(fontSize)}em`;
}
