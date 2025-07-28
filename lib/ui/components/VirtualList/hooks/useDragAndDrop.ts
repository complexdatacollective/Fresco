import { useDragSource, useDropTarget } from '~/lib/dnd';

type UseDragAndDropProps<T> = {
  item: T;
  index: number;
  draggable?: boolean;
  droppable?: boolean;
  itemType?: string;
  accepts?: string[];
  getDragMetadata?: (item: T) => Record<string, unknown>;
  getDragPreview?: (item: T) => React.ReactElement;
  onDrop?: (metadata: unknown) => void;
  listId?: string;
};

export const useDragAndDrop = <T>({
  item,
  index,
  draggable = false,
  droppable = false,
  itemType = 'item',
  accepts = [],
  getDragMetadata,
  getDragPreview,
  onDrop,
  listId,
}: UseDragAndDropProps<T>) => {
  // Drag source configuration
  const dragSource = useDragSource({
    type: itemType,
    metadata: getDragMetadata ? getDragMetadata(item) : { item, index },
    announcedName: `Item ${index + 1}`,
    disabled: !draggable,
    preview: getDragPreview ? getDragPreview(item) : undefined,
  });

  // Drop target configuration
  const dropTarget = useDropTarget({
    id: listId ? `${listId}-${index}` : `item-${index}`,
    accepts: accepts.length > 0 ? accepts : [itemType],
    announcedName: `Drop zone ${index + 1}`,
    onDrop: (metadata) => {
      if (onDrop) {
        onDrop(metadata);
      }
    },
    disabled: !droppable,
  });

  return {
    dragProps: draggable ? dragSource.dragProps : {},
    dropProps: droppable ? dropTarget.dropProps : {},
    isDragging: dragSource.isDragging,
    isOver: dropTarget.isOver,
    canDrop: true, // Simplified - assume can always drop for now
  };
};