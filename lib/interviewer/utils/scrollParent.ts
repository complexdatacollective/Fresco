export function scrollParent(
  node: HTMLElement | SVGElement | null,
): HTMLElement | SVGElement | null {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return null;
  }

  let current: Node | null = node.parentNode;
  const regex = /(auto|scroll)/;

  while (current && current instanceof Element && current.parentNode) {
    const style = getComputedStyle(current);
    const overflow = style.overflow + style.overflowY + style.overflowX;

    if (regex.test(overflow)) {
      return current as HTMLElement | SVGElement;
    }

    current = current.parentNode;
  }

  if (typeof document !== 'undefined') {
    return (document.scrollingElement ??
      document.documentElement) as HTMLElement;
  }

  return null;
}
