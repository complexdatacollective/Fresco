'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * A custom hook to create a portal for rendering children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 *
 * Handles both client-side rendering and server-side rendering scenarios.
 *
 * @param customTarget - An optional HTMLElement to use as the portal target. If not provided, defaults to document.body.
 * @returns A Portal component that can be used to wrap children to be rendered
 *          into the specified target element.
 */
const usePortal = (customTarget?: HTMLElement) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTargetElement(customTarget ?? document.body);

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
