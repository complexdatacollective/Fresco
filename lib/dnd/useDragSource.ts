import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDndStore } from './store';
import { type DragSourceOptions, type UseDragSourceReturn } from './types';
import {
  createUniqueId,
  findScrollableParent,
  autoScroll,
  rafThrottle,
} from './utils';
import {
  announce,
  getKeyboardDragAnnouncement,
  getDragInstructions,
} from './accessibility';

export function useDragSource(options: DragSourceOptions): UseDragSourceReturn {
  const { metadata, onDragStart, onDragEnd, disabled = false } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);
  const [currentDropTargetIndex, setCurrentDropTargetIndex] = useState(-1);
  const dragIdRef = useRef<string>(createUniqueId('drag'));
  const elementRef = useRef<HTMLElement | null>(null);
  const scrollableParentRef = useRef<HTMLElement | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);

  // Use selective subscriptions for better performance
  const startDrag = useDndStore((state) => state.startDrag);
  const updateDragPosition = useDndStore((state) => state.updateDragPosition);
  const endDrag = useDndStore((state) => state.endDrag);
  
  // Always subscribe to drop targets and activeDropTargetId for consistency
  // The performance impact is minimal and avoids conditional hook issues
  const activeDropTargetId = useDndStore((state) => state.activeDropTargetId);
  const dropTargets = useDndStore((state) => state.dropTargets);

  // Track pointer position for auto-scrolling
  const pointerPositionRef = useRef({ x: 0, y: 0 });

  // Throttled position update
  const updatePosition = useRef(rafThrottle(updateDragPosition)).current;

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

      // Get the drop target ID before ending drag
      const dropTargetId = useDndStore.getState().activeDropTargetId;

      // End drag
      endDrag();
      setIsDragging(false);

      // Call onDragEnd callback
      if (onDragEnd) {
        onDragEnd(metadata, dropTargetId);
      }

      // Release pointer capture if we have it
      const element = elementRef.current;
      if (element?.hasPointerCapture(e.pointerId)) {
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
      };

      const position = {
        x: e.pageX,
        y: e.pageY,
        width: rect.width,
        height: rect.height,
      };

      // Start drag
      startDrag(dragItem, position);
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
      updatePosition.cancel();
    };
  }, [updatePosition]);

  // Get compatible drop targets for keyboard navigation - memoized
  const getCompatibleDropTargets = useCallback(() => {
    if (!isDragging) return [];

    const itemType = metadata.type;
    if (typeof itemType !== 'string') return [];
    return Array.from(dropTargets.values()).filter((target) =>
      target.accepts.includes(itemType),
    );
  }, [isDragging, metadata.type, dropTargets]);

  // Navigate to next/previous drop target
  const navigateDropTargets = useCallback(
    (direction: 'next' | 'prev') => {
      const compatibleTargets = getCompatibleDropTargets();
      if (compatibleTargets.length === 0) return;

      let newIndex = currentDropTargetIndex;

      if (direction === 'next') {
        newIndex = (currentDropTargetIndex + 1) % compatibleTargets.length;
      } else {
        newIndex =
          currentDropTargetIndex <= 0
            ? compatibleTargets.length - 1
            : currentDropTargetIndex - 1;
      }

      setCurrentDropTargetIndex(newIndex);

      const target = compatibleTargets[newIndex];
      if (target) {
        // Update drag position to center of target
        const centerX = target.x + target.width / 2;
        const centerY = target.y + target.height / 2;
        updateDragPosition(centerX, centerY);

        announce(
          getKeyboardDragAnnouncement(
            'navigate',
            `Moved to drop target ${newIndex + 1} of ${compatibleTargets.length}`,
          ),
        );
      }
    },
    [currentDropTargetIndex, getCompatibleDropTargets, updateDragPosition],
  );

  // Start keyboard drag
  const startKeyboardDrag = useCallback(
    (element: HTMLElement) => {
      setIsKeyboardDragging(true);
      setIsDragging(true);
      setCurrentDropTargetIndex(-1);

      const rect = element.getBoundingClientRect();
      const dragItem = {
        id: dragIdRef.current,
        metadata,
      };

      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      };

      startDrag(dragItem, position);

      if (onDragStart) {
        onDragStart(metadata);
      }

      announce(getKeyboardDragAnnouncement('start', getDragInstructions()));
    },
    [metadata, startDrag, onDragStart],
  );

  // End keyboard drag
  const endKeyboardDrag = useCallback(
    (shouldDrop: boolean) => {
      if (!isKeyboardDragging) return;

      setIsKeyboardDragging(false);
      setIsDragging(false);
      setCurrentDropTargetIndex(-1);

      const dropTargetId = shouldDrop ? activeDropTargetId : null;

      endDrag();

      if (onDragEnd) {
        onDragEnd(metadata, dropTargetId);
      }

      if (shouldDrop && dropTargetId) {
        announce(
          getKeyboardDragAnnouncement('drop', 'Item dropped successfully'),
        );
      } else {
        announce(getKeyboardDragAnnouncement('cancel'));
      }
    },
    [isKeyboardDragging, activeDropTargetId, endDrag, metadata, onDragEnd],
  );

  // Handle keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (isKeyboardDragging) {
        // Handle navigation during drag
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            navigateDropTargets('next');
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            navigateDropTargets('prev');
            break;
          case ' ':
          case 'Enter':
            e.preventDefault();
            endKeyboardDrag(true);
            break;
          case 'Escape':
            e.preventDefault();
            endKeyboardDrag(false);
            break;
        }
      } else {
        // Start drag with Space or Enter
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          const element = e.currentTarget as HTMLElement;
          startKeyboardDrag(element);
        }
      }
    },
    [
      disabled,
      isKeyboardDragging,
      navigateDropTargets,
      endKeyboardDrag,
      startKeyboardDrag,
    ],
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
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
      } as const,
      isDragging,
    }),
    [handlePointerDown, handleKeyDown, isDragging, disabled],
  );
}
