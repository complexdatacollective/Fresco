'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const usePortal = (customTarget?: HTMLElement) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTargetElement(customTarget || document.body);

    return () => setMounted(false);
  }, [customTarget]);

  const Portal = useMemo(() => {
    return ({ children }: { children: ReactNode }) => {
      return mounted && targetElement
        ? createPortal(children, targetElement)
        : null;
    };
  }, [mounted, targetElement]);

  return Portal;
};

export default usePortal;
