import type { ReactNode } from 'react';
import { cn } from '~/utils/shadcn';

/**
 * Renders a panel container.
 */
const Panels = ({
  children,
  show = false,
}: {
  children: ReactNode;
  show: boolean;
}) => {
  const panelsClasses = cn(
    'flex flex-col basis-1/2 md:basis-1/3 max-w-96 shrink-0 transition-all duration-500 ease-in-out',
    !show && '!basis-0 opacity-0 overflow-hidden',
    show && 'mr-4',
  );
  return <div className={panelsClasses}>{children}</div>;
};

export default Panels;
