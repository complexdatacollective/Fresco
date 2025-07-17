import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDndStore } from './store';
import { type DragPreviewProps } from './types';

export function DragPreview({
  children,
  offset = { x: 0, y: 0 },
}: DragPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragItem = useDndStore((state) => state.dragItem);
  const isDragging = useDndStore((state) => state.isDragging);

  // Create container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '0';
    container.style.height = '0';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Update position
  useEffect(() => {
    if (containerRef.current && dragItem && isDragging) {
      const transform = `translate3d(${dragItem.x + offset.x}px, ${dragItem.y + offset.y}px, 0)`;
      containerRef.current.style.transform = transform;
      containerRef.current.style.willChange = 'transform';
    }
  }, [dragItem, isDragging, offset.x, offset.y]);

  if (!isDragging || !dragItem || !containerRef.current) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: 0.8,
        cursor: 'grabbing',
      }}
    >
      {children || (
        <div
          style={{
            width: dragItem.width,
            height: dragItem.height,
            backgroundColor: '#4299e1',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
      )}
    </div>,
    containerRef.current,
  );
}
