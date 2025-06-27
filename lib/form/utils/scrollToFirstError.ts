import { type TanStackFormErrors } from '~/lib/form/types';

const getScrollParent = (node: HTMLElement): Element => {
  const regex = /(auto|scroll)/;
  const parents = (_node: Element, ps: Element[]): Element[] => {
    if (_node.parentNode === null) {
      return ps;
    }
    return parents(_node.parentNode as Element, ps.concat([_node]));
  };

  const style = (_node: Element, prop: string): string =>
    getComputedStyle(_node, null).getPropertyValue(prop);

  const overflow = (_node: Element): string =>
    style(_node, 'overflow') +
    style(_node, 'overflow-y') +
    style(_node, 'overflow-x');

  const scroll = (_node: Element): boolean => regex.test(overflow(_node));

  const scrollParent = (_node: Element): Element => {
    if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
      return document.scrollingElement ?? document.documentElement;
    }

    const ps = parents(_node.parentNode as Element, []);

    for (const p of ps) {
      if (scroll(p)) {
        return p;
      }
    }

    return document.scrollingElement ?? document.documentElement;
  };

  return scrollParent(node);
};

export const scrollToFirstError = (errors: TanStackFormErrors) => {
  // Todo: first item is an assumption that may not be valid. Should iterate and check
  // vertical position to ensure it is actually the "first" in page order (topmost).
  if (!errors) return;

  const firstError = Object.keys(errors)[0];

  // All Fields have a name corresponding to variable ID so look this up.
  // When used on alter form, multiple forms can be differentiated by the active slide
  // class. This needs priority, so look it up first.
  const el: HTMLElement | null =
    document.querySelector(`.swiper-slide-active [name="${firstError}"]`) ??
    document.querySelector(`[name="${firstError}"]`);

  // If element is not found, prevent crash.
  if (!el) {
    // eslint-disable-next-line no-console
    console.warn(
      `scrollToFirstError(): Element [name="${firstError}"] not found in DOM`,
    );
    return;
  }

  // Subtract 200 to put more of the input in view.
  const topPos = el.offsetTop - 200;
  // Assume forms are inside a scrollable
  const scroller = getScrollParent(el);
  scroller.scrollTop = topPos;
};
