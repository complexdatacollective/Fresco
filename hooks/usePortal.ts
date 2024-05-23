import { useEffect, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const usePortal = (targetElement: HTMLElement = document.body) => {
  useEffect(() => {
    // Ensure the hook is only used in the browser
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      return;
    }
  }, []);

  const Portal = useMemo(() => {
    return ({ children }: { children: ReactNode }) => {
      return createPortal(children, targetElement);
    };
  }, [targetElement]);

  return Portal;
};

export default usePortal;
