import { type TanStackFormErrors } from '~/lib/form/types';
import { scrollParent } from '~/lib/interviewer/utils/scrollParent';

export const scrollToFirstError = (errors: TanStackFormErrors) => {
  // Todo: first item is an assumption that may not be valid. Should iterate and check
  // vertical position to ensure it is actually the "first" in page order (topmost).
  if (!errors) return;

  const firstError = Object.keys(errors)[0];
  const el: HTMLElement | null = document.querySelector(
    `[name="${firstError}"]`,
  );

  // If element is not found, prevent crash.
  if (!el) {
    // eslint-disable-next-line no-console
    console.warn(
      `scrollToFirstError(): Element [name="${firstError}"] not found in DOM`,
    );
    return;
  }

  const scroller = scrollParent(el) as unknown as HTMLElement;
  const scrollStart = scroller.scrollTop;
  const scrollerOffset = parseInt(
    scroller.getBoundingClientRect().top.toString(),
    10,
  );
  const destinationOffset = parseInt(
    el.getBoundingClientRect().top.toString(),
    10,
  );

  // Subtract 200 to put more of the input in view.
  const scrollEnd = destinationOffset + scrollStart - scrollerOffset - 200;
  scroller.scrollTop = scrollEnd;
};
