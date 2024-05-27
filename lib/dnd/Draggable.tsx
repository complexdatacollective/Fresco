import { type DragEventHandler } from 'react';
import useStore from './store';

export default function draggable(WrappedComponent) {
  return function Draggable(props) {
    const setDraggingItem = useStore((state) => state.setDraggingItem);

    const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
      setDraggingItem({ id: 'test', type: 'TEST_NODE' });
      event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd: DragEventHandler<HTMLDivElement> = () => {
      setDraggingItem(null);
    };

    return (
      <WrappedComponent
        {...props}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    );
  };
}
