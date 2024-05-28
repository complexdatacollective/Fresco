import { useEffect, useRef, useState } from 'react';
import useStore from './store';

type UseDroppableProps = {
  disabled?: boolean;
  onDrop?: (event: DragEvent) => void;
  accepts: string[];
};

export default function useDroppable(props: UseDroppableProps) {
  const { disabled, onDrop, accepts } = props;
  const [isActive, setIsActive] = useState(false); // is the user currently dragging something
  const [isValid, setIsValid] = useState(false); // is the user currently dragging something that can be dropped here
  const [isOver, setIsOver] = useState(false); // is the user currently dragging something over this component

  const draggingItem = useStore((state) => state.draggingItem);

  const ref = useRef<HTMLDivElement>(null);

  // Check if the item being dragged is valid
  useEffect(() => {
    if (!draggingItem) {
      setIsActive(false);
      setIsValid(false);

      return;
    }

    setIsActive(true);

    if (accepts.includes(draggingItem?.type)) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [draggingItem, accepts]);

  // Attach event listeners to the ref
  useEffect(() => {
    if (disabled) {
      console.log('disabled');
      return;
    }

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      setIsOver(true);
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      setIsOver(false);
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsOver(false);

      if (onDrop) {
        onDrop(event);
      }
    };

    const element = ref.current;

    if (element) {
      element.addEventListener('dragenter', handleDragEnter);
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragenter', handleDragEnter);
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      }
    };
  }, [disabled]);

  return {
    ref,
    isActive,
    isValid,
    isOver,
  };
}
