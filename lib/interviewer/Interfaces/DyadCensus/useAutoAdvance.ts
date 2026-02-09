import { useEffect, useRef } from 'react';

/**
 * Automatically advance stage when an option is selected.
 * If the option is changed, then wait a moment before advancing to
 * allow animations to be seen by the participant
 */
const useAutoAdvance = (
  next: () => void,
  isTouched: boolean,
  isChanged: boolean,
) => {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>();
  const nextRef = useRef<() => void>();

  nextRef.current = next;

  useEffect(() => {
    if (isTouched) {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      if (isChanged) {
        const delay = 350;
        timer.current = setTimeout(() => {
          nextRef.current?.();
        }, delay);
      } else {
        nextRef.current?.();
      }
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [isTouched, isChanged]);
};

export default useAutoAdvance;
