import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

type UseVirtualizationProps = {
  count: number;
  itemHeight: number;
  overscan?: number;
};

export const useVirtualization = ({ 
  count, 
  itemHeight, 
  overscan = 5 
}: UseVirtualizationProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  return {
    parentRef,
    virtualizer,
    totalSize: virtualizer.getTotalSize(),
    virtualItems: virtualizer.getVirtualItems(),
  };
};