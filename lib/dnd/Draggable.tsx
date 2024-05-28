import { forwardRef, type ComponentType, type DragEventHandler } from 'react';
import type { ItemType } from './config';
import useStore from './store';

export default function draggable(
  WrappedComponent: ComponentType,
  itemType: ItemType,
) {
  const Draggable = forwardRef((props, ref) => {
    const setDraggingItem = useStore((state) => state.setDraggingItem);

    const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
      console.log('drag start', itemType);
      setDraggingItem({ id: 'test', type: itemType });
      event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd: DragEventHandler<HTMLDivElement> = () => {
      setDraggingItem(null);
    };

    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        ref={ref}
      >
        <WrappedComponent {...props} />
      </div>
    );
  });

  Draggable.displayName = `Draggable(${WrappedComponent.displayName || WrappedComponent.name})`;

  return Draggable;
}
