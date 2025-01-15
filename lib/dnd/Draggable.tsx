import { type ForwardRefComponent } from 'motion/react';
import {
  type ForwardRefExoticComponent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import useStore, { type DraggingItem } from './store';

export const useDraggable = <T extends HTMLElement>(dragItem: DraggingItem) => {
  const ref = useRef<T | null>(null);
  const setDraggingItem = useStore((state) => state.setDraggingItem);

  const handleDragStart = useCallback(() => {
    console.log('drag start', dragItem.type);
    setDraggingItem(dragItem);
  }, [setDraggingItem, dragItem]);

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
  WrappedComponent: ForwardRefExoticComponent<
    ForwardRefComponent<unknown, unknown>
  >,
  dragItem: DraggingItem,
) {
  const Draggable = (props: Record<string, unknown>) => {
    const { ref } = useDraggable<HTMLDivElement>(dragItem);

    return <WrappedComponent {...props} ref={ref} />;
  };

  Draggable.displayName = `Draggable(${WrappedComponent.name})`;

  return Draggable;
}
