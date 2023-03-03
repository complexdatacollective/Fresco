import {
  useState,
  useEffect,
  ReactPortal,
  ReactNode,
} from 'react';
import { createPortal, unmountComponentAtNode } from 'react-dom';

type PortalState = {
  render: ({ children }: { children: ReactNode; }) => ReactPortal | null;
  remove: () => boolean;
};

const usePortal = (target: HTMLElement | null = document.querySelector('body')) => {
  const [portal, setPortal] = useState<PortalState>({
    render: () => null,
    remove: () => true,
  });

  useEffect(() => {
    if (!target) {
      return () => {};
    }

    const Portal = ({ children }: { children: ReactNode }) => createPortal(children, target);
    const remove = () => unmountComponentAtNode(target);

    setPortal({ render: Portal, remove });

    return () => {
      portal.remove();
    };
  }, [target, portal]);

  return portal.render;
};

export default usePortal;
