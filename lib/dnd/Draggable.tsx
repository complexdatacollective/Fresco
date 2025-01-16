import { useCallback, useEffect, useRef } from 'react';
import useStore, { type DraggingItem } from './store';

export const useDraggable = <T extends HTMLElement>(dragItem: DraggingItem) => {
  const ref = useRef<T | null>(null);
  const setDraggingItem = useStore((state) => state.setDraggingItem);

  const handleDragStart = useCallback(
    (evt: DragEvent) => {
      evt.stopPropagation();
      console.log('drag start', dragItem.type);

      // Now setup our dataTransfer object properly
      // First we'll allow a move action — this is used for the cursor
      evt.dataTransfer.effectAllowed = 'move';
      // Setup some dummy drag-data to ensure dragging
      evt.dataTransfer.setData('text/plain', 'some_dummy_data');
      // Now we'll create a dummy image for our dragImage
      const dragImage = document.createElement('div');
      dragImage.setAttribute(
        'style',
        'position: absolute; left: 0px; top: 0px; width: 40px; height: 40px; background: red; z-index: -1',
      );
      document.body.appendChild(dragImage);
      // And finally we assign the dragImage and center it on cursor
      evt.dataTransfer.setDragImage(dragImage, 20, 20);

      setDraggingItem(dragItem);
    },
    [setDraggingItem, dragItem],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingItem(null);
  }, [setDraggingItem]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const element = ref.current;

    element.draggable = true;

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);

    return () => {
      element.draggable = false;
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
    };
  }, [ref, handleDragEnd, handleDragStart]);

  return {
    ref,
  };
};

export default function draggable(
  WrappedComponent: React.ComponentType,
  dragItem: DraggingItem,
) {
  const Draggable = (props: Record<string, unknown>) => {
    const { ref } = useDraggable<HTMLDivElement>(dragItem);

    return <WrappedComponent {...props} ref={ref} />;
  };

  Draggable.displayName = `Draggable(${WrappedComponent.name})`;

  return Draggable;
}
