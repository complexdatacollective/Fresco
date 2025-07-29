'use client';

import { useDragSource } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import type { VirtualListProps } from '../types';

type DraggableVirtualItemProps<T> = {
  item: T;
  index: number;
  style: React.CSSProperties;
  onClick?: (item: T, index: number) => void;
  renderItem: VirtualListProps<T>['renderItem'];
  _isVisible: boolean;

  // Drag props
  itemType?: string;
  getDragMetadata?: (item: T) => Record<string, unknown>;
  getDragPreview?: (item: T) => React.ReactElement;
};

export const DraggableVirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  itemType = 'item',
  getDragMetadata,
  getDragPreview,
}: DraggableVirtualItemProps<T>) => {
  const { dragProps, isDragging } = useDragSource({
    type: itemType,
    metadata: getDragMetadata ? getDragMetadata(item) : { item },
    announcedName: `Item ${index}`,
    preview: getDragPreview ? getDragPreview(item) : undefined,
  });

  const handleClick = () => {
    if (onClick && !isDragging) {
      onClick(item, index);
    }
  };

  return (
    <div
      {...dragProps}
      style={style}
      onClick={handleClick}
      className={cn(onClick && 'cursor-pointer', isDragging && 'opacity-50')}
    >
      {renderItem({ item, index, style })}
    </div>
  );
};
