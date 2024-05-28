import { forwardRef, type ComponentType, type DragEventHandler } from 'react';
import useStore from './store';

export default function draggable(WrappedComponent: ComponentType) {
  const Draggable = forwardRef((props, ref) => {
    const setDraggingItem = useStore((state) => state.setDraggingItem);

    const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
      setDraggingItem({ id: 'test', type: 'EXISTING_NODE' });
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
