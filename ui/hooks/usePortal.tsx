import { useState, useEffect, ReactNode } from 'react';
import { createPortal, unmountComponentAtNode } from 'react-dom';

type PortalState = {
  render: Function;
  remove: Function;
};

const usePortal = (
  target: HTMLElement | null = document.querySelector('body'),
) => {
  const [portal, setPortal] = useState<PortalState>({
    render: () => null,
    remove: () => null,
  });

  useEffect(() => {
    if (!target) {
      return;
    }

    const Portal = ({ children }: { children: ReactNode }) =>
      createPortal(children, target);
    const remove = () => unmountComponentAtNode(target);

    setPortal({ render: Portal, remove });
    return () => portal.remove();
  }, [target]);

  return portal.render;
};

export default usePortal;
