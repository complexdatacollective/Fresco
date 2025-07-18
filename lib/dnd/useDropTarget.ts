import { useCallback, useEffect, useRef, useState } from 'react';
import { useDndStore } from './store';
import {
  type DropTargetOptions,
  type UseDropTargetReturn,
  type DragItem,
} from './types';
import { createUniqueId, getElementBounds, rafThrottle } from './utils';

export function useDropTarget(options: DropTargetOptions): UseDropTargetReturn {
  const {
    accepts,
    onDrop,
    onDragEnter,
    onDragLeave,
    disabled = false,
  } = options;

  const dropIdRef = useRef<string>(createUniqueId('drop'));
  const elementRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const lastDragItemRef = useRef<DragItem | null>(null);

  const {
    dragItem,
    activeDropTargetId,
    isDragging,
    registerDropTarget,
    unregisterDropTarget,
    updateDropTarget,
  } = useDndStore();

  // Memoize the accepts array to ensure stable reference
  const acceptsRef = useRef(accepts);
  acceptsRef.current = accepts;

  // Throttled bounds update
  const updateBounds = useRef(
    rafThrottle(() => {
      if (elementRef.current && !disabled) {
        const bounds = getElementBounds(elementRef.current);
        updateDropTarget(dropIdRef.current, bounds);
      }
    }),
  ).current;

  // Handle element ref
  const setRef = useCallback(
    (element: HTMLElement | null) => {
      // Clean up previous element
      if (elementRef.current && elementRef.current !== element) {
        resizeObserverRef.current?.disconnect();
        intersectionObserverRef.current?.disconnect();
      }

      elementRef.current = element;

      if (element && !disabled) {
        // Initial registration
        const bounds = getElementBounds(element);
        registerDropTarget({
          id: dropIdRef.current,
          ...bounds,
          accepts: acceptsRef.current,
        });

        // Set up ResizeObserver for size changes
        resizeObserverRef.current = new ResizeObserver(() => {
          updateBounds();
        });
        resizeObserverRef.current.observe(element);

        // Set up IntersectionObserver for visibility changes
        intersectionObserverRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting) {
              updateBounds();
            }
          },
          { threshold: 0.1 },
        );
        intersectionObserverRef.current.observe(element);

        // Listen for scroll events on the document and scrollable parents
        const scrollListeners: { element: Element | Document; handler: () => void }[] = [];
        const handleScroll = () => updateBounds();
        const handleResize = () => updateBounds();
        
        // Add document scroll listener
        document.addEventListener('scroll', handleScroll, {
          passive: true,
          capture: true,
        });
        scrollListeners.push({ element: document, handler: handleScroll });
        
        // Add window resize listener
        window.addEventListener('resize', handleResize, {
          passive: true,
        });
        
        // Find and listen to all scrollable parents
        let parent = element.parentElement;
        while (parent) {
          const style = getComputedStyle(parent);
          const hasScrollableContent = 
            (style.overflowY === 'auto' || style.overflowY === 'scroll') ||
            (style.overflowX === 'auto' || style.overflowX === 'scroll');
            
          if (hasScrollableContent) {
            parent.addEventListener('scroll', handleScroll, {
              passive: true,
              capture: false,
            });
            scrollListeners.push({ element: parent, handler: handleScroll });
          }
          parent = parent.parentElement;
        }

        // Store cleanup function
        (element as HTMLElement & { __dndCleanup?: () => void }).__dndCleanup = () => {
          scrollListeners.forEach(({ element: el, handler }) => {
            el.removeEventListener('scroll', handler, {
              capture: el === document,
            });
          });
          window.removeEventListener('resize', handleResize);
        };
      }
    },
    [disabled, registerDropTarget, updateBounds],
  );

  // Update isOver state
  useEffect(() => {
    const isCurrentlyOver = activeDropTargetId === dropIdRef.current;
    setIsOver(isCurrentlyOver);

    // Handle drag enter/leave callbacks
    if (isCurrentlyOver && !isOver && onDragEnter && dragItem) {
      onDragEnter(dragItem.metadata);
    } else if (
      !isCurrentlyOver &&
      isOver &&
      onDragLeave &&
      lastDragItemRef.current
    ) {
      onDragLeave(lastDragItemRef.current.metadata);
    }
  }, [activeDropTargetId, isOver, onDragEnter, onDragLeave, dragItem]);

  // Update canDrop state and track drag item
  useEffect(() => {
    if (dragItem && !disabled) {
      const itemType = dragItem.metadata.type as string;
      const canAccept = acceptsRef.current.includes(itemType);
      setCanDrop(canAccept);
      lastDragItemRef.current = dragItem;
    } else {
      setCanDrop(false);
      if (!dragItem) {
        lastDragItemRef.current = null;
      }
    }
  }, [dragItem, disabled]);

  // Handle drop and position updates during drag
  useEffect(() => {
    const unsubscribe = useDndStore.subscribe(
      (state) => state.isDragging,
      (isDragging, wasDragging) => {
        // Drag just started - update bounds immediately
        if (isDragging && !wasDragging) {
          updateBounds();
        }
        
        // Drag just ended
        if (!isDragging && wasDragging) {
          const state = useDndStore.getState();
          const wasOver = state.activeDropTargetId === dropIdRef.current;
          const draggedItem = lastDragItemRef.current;

          if (wasOver && draggedItem && canDrop && onDrop) {
            onDrop(draggedItem.metadata);
          }
        }
      },
    );

    return unsubscribe;
  }, [canDrop, onDrop, updateBounds]);

  // Clean up on unmount or when disabled
  useEffect(() => {
    const id = dropIdRef.current;

    return () => {
      unregisterDropTarget(id);
      resizeObserverRef.current?.disconnect();
      intersectionObserverRef.current?.disconnect();
      updateBounds.cancel();

      // Clean up scroll listener
      const element = elementRef.current;
      const elementWithCleanup = element as HTMLElement & { __dndCleanup?: () => void };
      if (element && elementWithCleanup.__dndCleanup) {
        elementWithCleanup.__dndCleanup();
      }
    };
  }, [unregisterDropTarget, updateBounds]);

  // Update registration when disabled state changes
  useEffect(() => {
    if (disabled) {
      unregisterDropTarget(dropIdRef.current);
    } else if (elementRef.current) {
      const bounds = getElementBounds(elementRef.current);
      registerDropTarget({
        id: dropIdRef.current,
        ...bounds,
        accepts: acceptsRef.current,
      });
    }
  }, [disabled, registerDropTarget, unregisterDropTarget]);

  return {
    dropProps: {
      'ref': setRef,
      'aria-dropeffect': canDrop ? 'move' : 'none',
      'data-drop-target': true,
      // Only make drop zones focusable when keyboard dragging is active
      'tabIndex': isDragging ? 0 : -1,
      'style': {
        // Only include minimal styles for accessibility
        position: 'relative',
      },
    },
    isOver,
    willAccept: canDrop,
    isDragging,
  };
}
