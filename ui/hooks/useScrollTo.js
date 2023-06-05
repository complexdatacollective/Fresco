import { useEffect, useRef } from 'react';
import scrollparent from 'scrollparent';

const isElementVisible = (element, container) => {
  const elementBounds = element.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const containerScrollPos = container.scrollTop;

  const containerViewport = {
    top: containerScrollPos,
    bottom: containerScrollPos + containerBounds.height,
  };

  return (
    elementBounds.top > 0
    && elementBounds.top < containerViewport.top
    && (elementBounds.top + elementBounds.height + containerScrollPos) < containerViewport.bottom
  );
};

const scrollFocus = (
  destination,
  delay = 0,
) => {
  if (!destination) { return null; }

  return setTimeout(() => {
    const scroller = scrollparent(destination);
    const scrollStart = scroller.scrollTop;
    const scrollerOffset = parseInt(scroller.getBoundingClientRect().top, 10);
    const destinationOffset = parseInt(destination.getBoundingClientRect().top, 10);

    const scrollEnd = destinationOffset + scrollStart - scrollerOffset;

    // If element is already visible, don't scroll
    if (isElementVisible(destination, scroller)) {
      return;
    }

    scroller.scrollTop = scrollEnd;
  }, delay);
};

/**
 * Automatically scroll to ref after conditions are met
 *
 * @param {object} ref react ref object
 * @param {func} condition when this is true, run scoll to to, receives watch array as arguments
 * @param {array} watch values to watch for changes, same as useEffect;
 * @param {number} delay (optional) delay before triggering scroll effect
 * e.g. after parent animation
 */
const useScrollTo = (
  ref,
  condition,
  watch,
  delay = 0,
) => {
  const timer = useRef();

  useEffect(() => {
    if (ref && ref.current && condition(...watch)) {
      clearTimeout(timer.current);
      timer.current = scrollFocus(ref.current, delay);
    }
  }, watch);
};

export default useScrollTo;
