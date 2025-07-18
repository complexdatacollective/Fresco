import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
    zoneId,
    name,
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

  // Use selective subscriptions for better performance
  const dragItem = useDndStore((state) => state.dragItem);
  const isDragging = useDndStore((state) => state.isDragging);
  const registerDropTarget = useDndStore((state) => state.registerDropTarget);
  const unregisterDropTarget = useDndStore(
    (state) => state.unregisterDropTarget,
  );
  const updateDropTarget = useDndStore((state) => state.updateDropTarget);

  // Only subscribe to activeDropTargetId changes that affect THIS dropzone
  const isOverFromStore = useDndStore(
    (state) => state.activeDropTargetId === dropIdRef.current,
  );

  // Memoize the accepts array to ensure stable reference
  const acceptsRef = useRef(accepts);
  acceptsRef.current = accepts;

  // Immediate bounds update (no throttling) for drag operations
  const updateBoundsImmediate = useCallback(() => {
    if (elementRef.current && !disabled) {
      const bounds = getElementBounds(elementRef.current);
      updateDropTarget(dropIdRef.current, bounds);
    }
  }, [disabled, updateDropTarget]);

  // Throttled bounds update for non-drag operations
  const updateBoundsThrottled = useRef(
    rafThrottle(() => {
      updateBoundsImmediate();
    }),
  ).current;

  // Smart bounds update that chooses throttled or immediate based on drag state
  const updateBounds = useCallback(() => {
    if (isDragging) {
      // During drag operations, update immediately to ensure accurate hit detection
      updateBoundsImmediate();
    } else {
      // Outside of drag operations, use throttled updates for performance
      updateBoundsThrottled();
    }
  }, [isDragging, updateBoundsImmediate, updateBoundsThrottled]);

  // Handle element ref
  const setRef = useCallback(
    (element: HTMLElement | null) => {
      // Clean up previous element
      if (elementRef.current && elementRef.current !== element) {
        resizeObserverRef.current?.disconnect();
        intersectionObserverRef.current?.disconnect();

        // Clean up previous scroll listeners
        const previousElement = elementRef.current as HTMLElement & {
          __dndCleanup?: () => void;
        };
        if (previousElement.__dndCleanup) {
          previousElement.__dndCleanup();
          delete previousElement.__dndCleanup;
        }
      }

      elementRef.current = element;

      if (element && !disabled) {
        // Initial registration
        const bounds = getElementBounds(element);
        registerDropTarget({
          id: dropIdRef.current,
          ...bounds,
          accepts: acceptsRef.current,
          zoneId,
          name,
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
        const scrollListeners: {
          element: Element | Document;
          handler: () => void;
          options: AddEventListenerOptions;
        }[] = [];
        const handleScroll = () => updateBounds();
        const handleResize = () => updateBounds();

        // Add document scroll listener
        const documentScrollOptions: AddEventListenerOptions = {
          passive: true,
          capture: true,
        };
        document.addEventListener(
          'scroll',
          handleScroll,
          documentScrollOptions,
        );
        scrollListeners.push({
          element: document,
          handler: handleScroll,
          options: documentScrollOptions,
        });

        // Add window resize listener
        const windowResizeOptions: AddEventListenerOptions = {
          passive: true,
        };
        window.addEventListener('resize', handleResize, windowResizeOptions);

        // Find and listen to all scrollable parents
        let parent = element.parentElement;
        while (parent) {
          const style = getComputedStyle(parent);
          const hasScrollableContent =
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll' ||
            style.overflowX === 'auto' ||
            style.overflowX === 'scroll';

          if (hasScrollableContent) {
            const parentScrollOptions: AddEventListenerOptions = {
              passive: true,
              capture: false,
            };
            parent.addEventListener(
              'scroll',
              handleScroll,
              parentScrollOptions,
            );
            scrollListeners.push({
              element: parent,
              handler: handleScroll,
              options: parentScrollOptions,
            });
          }
          parent = parent.parentElement;
        }

        // Store cleanup function with proper event listener removal
        (element as HTMLElement & { __dndCleanup?: () => void }).__dndCleanup =
          () => {
            scrollListeners.forEach(({ element: el, handler, options }) => {
              el.removeEventListener('scroll', handler, options);
            });
            window.removeEventListener(
              'resize',
              handleResize,
              windowResizeOptions,
            );
          };
      }
    },
    [disabled, registerDropTarget, updateBounds, zoneId, name],
  );

  // Update isOver state - only re-renders when THIS dropzone's isOver changes
  useEffect(() => {
    setIsOver(isOverFromStore);

    // Handle drag enter/leave callbacks
    if (isOverFromStore && !isOver && onDragEnter && dragItem) {
      onDragEnter(dragItem.metadata);
    } else if (
      !isOverFromStore &&
      isOver &&
      onDragLeave &&
      lastDragItemRef.current
    ) {
      onDragLeave(lastDragItemRef.current.metadata);
    }
  }, [isOverFromStore, isOver, onDragEnter, onDragLeave, dragItem]);

  // Update canDrop state and track drag item - memoized to prevent unnecessary re-renders
  useEffect(() => {
    if (dragItem && !disabled) {
      const itemType = dragItem.metadata.type as string;
      const sourceZone = dragItem.metadata.sourceZone as string;
      const canAcceptType = acceptsRef.current.includes(itemType);

      // Prevent dropping back into the same zone
      const canAccept = canAcceptType && (!zoneId || sourceZone !== zoneId);

      setCanDrop(canAccept);
      lastDragItemRef.current = dragItem;
    } else {
      setCanDrop(false);
      if (!dragItem) {
        lastDragItemRef.current = null;
      }
    }
  }, [dragItem, disabled, zoneId]);

  // Handle drop and position updates during drag - optimized subscription
  useEffect(() => {
    const unsubscribe = useDndStore.subscribe(
      (state) => state.isDragging,
      (isDragging, wasDragging) => {
        // Drag just started - update bounds immediately
        if (isDragging && !wasDragging) {
          updateBoundsImmediate();
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
  }, [canDrop, onDrop, updateBoundsImmediate]);

  // Clean up on unmount or when disabled
  useEffect(() => {
    const id = dropIdRef.current;

    return () => {
      unregisterDropTarget(id);
      resizeObserverRef.current?.disconnect();
      intersectionObserverRef.current?.disconnect();
      updateBoundsThrottled.cancel();

      // Clean up scroll listeners
      const element = elementRef.current;
      const elementWithCleanup = element as HTMLElement & {
        __dndCleanup?: () => void;
      };
      if (element && elementWithCleanup.__dndCleanup) {
        elementWithCleanup.__dndCleanup();
        delete elementWithCleanup.__dndCleanup;
      }
    };
  }, [unregisterDropTarget, updateBoundsThrottled]);

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
        zoneId,
        name,
      });
    }
  }, [disabled, registerDropTarget, unregisterDropTarget, zoneId, name]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => {
    // Check if this is the source zone for the current drag item
    const isSourceZone =
      dragItem && zoneId && dragItem.metadata.sourceZone === zoneId;

    return {
      dropProps: {
        'ref': setRef,
        'aria-dropeffect': canDrop ? 'move' : 'none',
        'aria-label': name,
        'data-drop-target': true,
        'data-zone-id': zoneId,
        // Only make drop zones focusable when keyboard dragging is active
        'tabIndex': isDragging ? 0 : -1,
        'style': {
          // Only include minimal styles for accessibility
          position: 'relative',
        },
      } as const,
      // Source zone should not show any drag styling
      isOver: isSourceZone ? false : isOver,
      willAccept: isSourceZone ? false : canDrop,
      isDragging: isSourceZone ? false : isDragging,
    };
  }, [setRef, canDrop, isDragging, isOver, zoneId, dragItem, name]);
}
