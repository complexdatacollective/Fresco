import { useCallback, useEffect, useRef, useState } from 'react';
import { useDndStore } from './store';
import {
  type DragSourceOptions,
  type UseDragSourceReturn,
  type DragMetadata,
} from './types';
import {
  createUniqueId,
  findScrollableParent,
  autoScroll,
  rafThrottle,
} from './utils';

export function useDragSource(options: DragSourceOptions): UseDragSourceReturn {
  const {
    metadata,
    preview,
    onDragStart,
    onDragEnd,
    disabled = false,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dragIdRef = useRef<string>(createUniqueId('drag'));
  const elementRef = useRef<HTMLElement | null>(null);
  const scrollableParentRef = useRef<HTMLElement | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);

  const { startDrag, updateDragPosition, endDrag, activeDropTargetId } =
    useDndStore();

  // Track pointer position for auto-scrolling
  const pointerPositionRef = useRef({ x: 0, y: 0 });

  // Throttled position update
  const updatePosition = useRef(
    rafThrottle((x: number, y: number) => {
      updateDragPosition(x, y);
    }),
  ).current;

  // Auto-scroll handling
  const handleAutoScroll = useCallback(() => {
    if (scrollableParentRef.current && isDragging) {
      autoScroll(
        scrollableParentRef.current,
        pointerPositionRef.current.x,
        pointerPositionRef.current.y,
      );
      autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
    }
  }, [isDragging]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();

      // Update pointer position for auto-scroll
      pointerPositionRef.current = { x: e.clientX, y: e.clientY };

      // Update drag position
      updatePosition(e.pageX, e.pageY);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();

      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      // Cancel auto-scroll
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }

      // End drag
      endDrag();
      setIsDragging(false);

      // Call onDragEnd callback
      if (onDragEnd) {
        const dropTargetId = useDndStore.getState().activeDropTargetId;
        onDragEnd(metadata, dropTargetId);
      }

      // Release pointer capture if we have it
      const element = elementRef.current;
      if (element && element.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }
    },
    [handlePointerMove, endDrag, metadata, onDragEnd],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return; // Only handle left mouse button

      const element = e.currentTarget as HTMLElement;
      elementRef.current = element;

      // Get element bounds
      const rect = element.getBoundingClientRect();
      const dragItem = {
        id: dragIdRef.current,
        metadata,
        x: e.pageX,
        y: e.pageY,
        width: rect.width,
        height: rect.height,
      };

      // Start drag
      startDrag(dragItem);
      setIsDragging(true);

      // Find scrollable parent
      scrollableParentRef.current = findScrollableParent(element);

      // Start auto-scroll
      if (scrollableParentRef.current) {
        pointerPositionRef.current = { x: e.clientX, y: e.clientY };
        autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
      }

      // Call onDragStart callback
      if (onDragStart) {
        onDragStart(metadata);
      }

      // Capture pointer for consistent events
      element.setPointerCapture(e.pointerId);

      // Add event listeners
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      // Prevent default to avoid text selection
      e.preventDefault();
    },
    [
      disabled,
      metadata,
      startDrag,
      handlePointerMove,
      handlePointerUp,
      handleAutoScroll,
      onDragStart,
    ],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
      }
      (updatePosition as any).cancel?.();
    };
  }, [updatePosition]);

  // Handle keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      // Space or Enter to start drag
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        // TODO: Implement keyboard drag
        console.log('Keyboard drag not yet implemented');
      }
    },
    [disabled],
  );

  return {
    dragProps: {
      'onPointerDown': handlePointerDown,
      'onKeyDown': handleKeyDown,
      'aria-grabbed': isDragging,
      'aria-dropeffect': 'move',
      'role': 'button',
      'tabIndex': disabled ? -1 : 0,
      'style': {
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      },
    },
    isDragging,
  };
}
