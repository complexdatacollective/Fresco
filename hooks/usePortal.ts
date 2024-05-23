import { useEffect, useMemo, useRef, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const usePortal = (targetElement: HTMLElement | null = null) => {
  const portalNodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure the hook is only used in the browser
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      return;
    }
  }, []);

  useEffect(() => {
    const node = targetElement ?? document.body;
    portalNodeRef.current = node;

    return () => {
      portalNodeRef.current = null;
    };
  }, [targetElement]);

  const Portal: FC<{ children: ReactNode }> = ({ children }) => {
    if (!portalNodeRef.current) return null;
    return createPortal(children, portalNodeRef.current);
  };

  return useMemo(() => Portal, []);
};

export default usePortal;
