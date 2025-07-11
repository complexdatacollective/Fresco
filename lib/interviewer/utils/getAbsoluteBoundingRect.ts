import { isDOMElement } from '../behaviours/DragAndDrop/utils/domValidation';

/**
https://gist.github.com/rgrove/5463265

Returns a bounding rect for _el_ with absolute coordinates corrected for
scroll positions.

The native `getBoundingClientRect()` returns coordinates for an element's
visual position relative to the top left of the viewport, so if the element
is part of a scrollable region that has been scrolled, its coordinates will
be different than if the region hadn't been scrolled.

This method corrects for scroll offsets all the way up the node tree, so the
returned bounding rect will represent an absolute position on a virtual
canvas, regardless of scrolling.

@param el HTML element.
@return Absolute bounding rect for _el_ or null if invalid element.
*/

type BoundingRect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

export default function getAbsoluteBoundingRect(el: unknown): BoundingRect | null {
  if (!isDOMElement(el)) {
    // eslint-disable-next-line no-console
    console.error('getAbsoluteBoundingRect: Invalid element passed', el);
    return null;
  }

  let offsetX = window.scrollX ?? document.documentElement?.scrollLeft ?? 0;
  let offsetY = window.scrollY ?? document.documentElement?.scrollTop ?? 0;

  const rect = el.getBoundingClientRect();

  if (el !== document.body) {
    let parent = el.parentElement;

    // The element's rect will be affected by the scroll positions of
    // *all* of its scrollable parents, not just the window, so we have
    // to walk up the tree and collect every scroll offset. Good times.
    while (parent && parent !== document.body) {
      offsetX += parent.scrollLeft;
      offsetY += parent.scrollTop;
      parent = parent.parentElement;
    }
  }

  return {
    bottom: rect.bottom + offsetY,
    height: rect.height,
    left: rect.left + offsetX,
    right: rect.right + offsetX,
    top: rect.top + offsetY,
    width: rect.width,
  };
}
