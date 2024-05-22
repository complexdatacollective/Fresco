import { useEffect, useState, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PortalProps = {
  children: ReactNode;
};

const usePortal = (targetElement?: HTMLElement | null) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure the hook is only used in the browser
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      return;
    }

    const element = targetElement ?? document.body;
    setPortalElement(element);
  }, [targetElement]);

  const Portal: FC<PortalProps> = ({ children }) => {
    if (!portalElement) return null;
    return createPortal(children, portalElement);
  };

  return Portal;
};

export default usePortal;
