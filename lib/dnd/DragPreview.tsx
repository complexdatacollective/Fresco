import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDndStore } from './store';
import { type DragPreviewProps } from './types';

export function DragPreview({
  children,
  offset = { x: 0, y: 0 },
}: DragPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Use selective subscriptions instead of multiple useDndStore() calls
  const dragItem = useDndStore((state) => state.dragItem);
  const dragPosition = useDndStore((state) => state.dragPosition);
  const dragPreview = useDndStore((state) => state.dragPreview);
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

  // Update position with memoized values
  useEffect(() => {
    if (
      !containerRef.current ||
      !dragPosition ||
      !isDragging ||
      !previewRef.current
    ) {
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current || !previewRef.current) return;

      // Get the dimensions of the preview element
      const rect = previewRef.current.getBoundingClientRect();
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;

      // Center the preview under the cursor
      const transform = `translate3d(${dragPosition.x - halfWidth + offset.x}px, ${dragPosition.y - halfHeight + offset.y}px, 0)`;
      containerRef.current.style.transform = transform;
      containerRef.current.style.willChange = 'transform';
    };

    // Initial position update
    updatePosition();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(previewRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dragPosition, isDragging, offset.x, offset.y]);

  if (!isDragging || !dragItem || !dragPosition || !containerRef.current) {
    return null;
  }

  // Determine what to render as preview
  const previewContent = dragPreview ?? children;

  return createPortal(
    <div
      ref={previewRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: 0.8,
        cursor: 'grabbing',
        pointerEvents: 'none',
      }}
    >
      {previewContent}
    </div>,
    containerRef.current,
  );
}
