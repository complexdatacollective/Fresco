import { type RefObject, useEffect } from 'react';

const useResizeObserver = <T extends HTMLElement>(
  callback: ResizeObserverCallback,
  elementRef: RefObject<T>,
  options?: ResizeObserverOptions,
) => {
  useEffect(() => {
    if (!elementRef.current) return;

    const resizeObserver = new ResizeObserver(callback);
    resizeObserver.observe(elementRef.current, options);

    return () => {
      resizeObserver.disconnect();
    };
  }, [callback, elementRef, options]);
};

export default useResizeObserver;
