import type React from 'react';
import {
  createElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { type Prettify } from '~/utils/prettify';
import { useDndStore, useDndStoreApi } from './DndStoreProvider';
import { type DragMetadata } from './types';
import {
  getDropTargetDescription,
  getKeyboardDragAnnouncement,
  useAccessibilityAnnouncements,
} from './useAccessibilityAnnouncements';
import { findSourceZone, rafThrottle } from './utils';

// Default threshold in pixels - drag won't start until cursor moves this far
const DEFAULT_DRAG_THRESHOLD = 5;

// Hook-specific types
type DragSourceOptions = {
  type: string;
  metadata?: DragMetadata;
  announcedName?: string;
  preview?: ReactNode;
  disabled?: boolean;
  dragThreshold?: number;
};

type PendingDrag = {
  startPosition: { x: number; y: number };
  element: HTMLElement;
  pointerId: number;
};

type UseDragSourceReturn = {
  dragProps: {
    'ref': (element: HTMLElement | null) => void;
    'onPointerDown': (e: React.PointerEvent) => void;
    'onKeyDown': (e: React.KeyboardEvent) => void;
    'style'?: React.CSSProperties;
    'aria-grabbed'?: boolean;
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'aria-label'?: string;
    'role'?: string;
    'tabIndex'?: number;
  };
  isDragging: boolean;
};

export function useDragSource(
  options: Prettify<DragSourceOptions>,
): Prettify<UseDragSourceReturn> {
  const {
    type,
    metadata,
    announcedName,
    preview,
    disabled = false,
    dragThreshold = DEFAULT_DRAG_THRESHOLD,
  } = options;
  const previewComponent = preview;

  const { announce } = useAccessibilityAnnouncements();

  const [dragMode, setDragMode] = useState<'none' | 'pointer' | 'keyboard'>(
    'none',
  );
  const [currentDropTargetIndex, setCurrentDropTargetIndex] = useState(-1);
  const dragId = useId();
  const elementRef = useRef<HTMLElement | null>(null);
  const pendingDragRef = useRef<PendingDrag | null>(null);

  const startDrag = useDndStore((state) => state.startDrag);
  const updateDragPosition = useDndStore((state) => state.updateDragPosition);
  const endDrag = useDndStore((state) => state.endDrag);

  const updatePosition = useRef(rafThrottle(updateDragPosition)).current;

  const createPreview = useCallback(
    (element: HTMLElement | null): ReactNode => {
      if (previewComponent !== undefined) return previewComponent;
      if (!element) return null;

      // Capture the element's exact computed size
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.pointerEvents = 'none';

      // Ensure the preview shows the dragging state
      clonedElement.setAttribute('data-dragging', 'true');

      // Apply the exact computed dimensions to ensure visual consistency
      clonedElement.style.width = `${rect.width}px`;
      clonedElement.style.height = `${rect.height}px`;
      clonedElement.style.minWidth = `${rect.width}px`;
      clonedElement.style.minHeight = `${rect.height}px`;
      clonedElement.style.maxWidth = `${rect.width}px`;
      clonedElement.style.maxHeight = `${rect.height}px`;

      // Preserve box-sizing to ensure dimensions are applied correctly
      clonedElement.style.boxSizing = computedStyle.boxSizing;

      clonedElement.removeAttribute('id');
      clonedElement
        .querySelectorAll('[id]')
        .forEach((el) => el.removeAttribute('id'));

      return createElement('div', {
        dangerouslySetInnerHTML: { __html: clonedElement.outerHTML },
      });
    },
    [previewComponent],
  );

  // Unified drag initialization logic
  const initializeDrag = useCallback(
    (
      element: HTMLElement,
      position: { x: number; y: number },
      mode: 'pointer' | 'keyboard',
    ) => {
      elementRef.current = element;
      setDragMode(mode);

      const rect = element.getBoundingClientRect();
      const sourceZone = findSourceZone(element);
      const dragItem = {
        id: dragId,
        type,
        metadata,
        _sourceZone: sourceZone,
      };
      const dragPosition = {
        ...position,
        width: rect.width,
        height: rect.height,
      };
      const dragPreview = createPreview(element);

      startDrag(dragItem, dragPosition, dragPreview);

      // Only hide the element during pointer drag
      if (mode === 'pointer') {
        element.style.visibility = 'hidden';
      }
    },
    [dragId, type, metadata, createPreview, startDrag],
  );

  // Unified drag end logic
  const storeApi = useDndStoreApi();
  const finishDrag = useCallback(
    (shouldDrop = true) => {
      const activeDropTargetId = storeApi.getState().activeDropTargetId;
      const isSuccessfulDrop = shouldDrop && activeDropTargetId !== null;

      if (!shouldDrop) {
        storeApi.getState().setActiveDropTarget(null);
      }

      endDrag();
      setDragMode('none');
      setCurrentDropTargetIndex(-1);

      const element = elementRef.current;
      if (element) {
        if (isSuccessfulDrop) {
          // Leave the element hidden so AnimatePresence exit doesn't flash
          // the item back in its original position. The element will be
          // removed from the DOM when the exit animation completes.
          // Safety net: restore visibility if the item is still in the DOM
          // after the exit animation would have completed (e.g. the drop
          // handler didn't actually remove the item).
          setTimeout(() => {
            if (element.isConnected) {
              element.style.visibility = '';
            }
          }, 500);
        } else {
          element.style.visibility = '';
        }
      }

      // Announce keyboard drag result for failed drops only
      // Successful drops are announced by the drop target
      if (dragMode === 'keyboard' && !isSuccessfulDrop) {
        const itemName = announcedName ?? 'Item';
        announce(`Drop cancelled, ${itemName} returned to original position`);
      }
    },
    [endDrag, dragMode, announce, announcedName, storeApi],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();

      // Check if we have a pending drag that hasn't met the threshold yet
      if (pendingDragRef.current && dragMode === 'none') {
        const { startPosition, element } = pendingDragRef.current;
        const distance = Math.hypot(
          e.clientX - startPosition.x,
          e.clientY - startPosition.y,
        );

        if (distance >= dragThreshold) {
          // Threshold met - initialize the drag
          initializeDrag(element, startPosition, 'pointer');
          pendingDragRef.current = null;
        }
        return;
      }

      // Normal drag position update
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition, dragThreshold, dragMode, initializeDrag],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      // Check if we have a pending drag that never met the threshold
      if (pendingDragRef.current) {
        const { element, pointerId } = pendingDragRef.current;
        if (element.hasPointerCapture(pointerId)) {
          element.releasePointerCapture(pointerId);
        }
        pendingDragRef.current = null;
        // Don't call finishDrag - let the click event fire for selection
        return;
      }

      const element = elementRef.current;
      if (element?.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }

      // Suppress the click event that follows pointer up after a real drag.
      // This prevents selection from triggering after drag-and-drop.
      const cleanup = () => {
        document.removeEventListener('click', suppressClick, true);
      };
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
        cleanup();
      };
      document.addEventListener('click', suppressClick, true);

      // Safety cleanup: when pointer capture caused significant movement
      // (a real drag), the browser won't synthesize a click event, leaving
      // the listener to swallow the user's next intentional click. Remove
      // it after the current event cycle — any synthetic click from this
      // pointer-up sequence fires synchronously before setTimeout(0).
      setTimeout(cleanup, 0);

      finishDrag(true);
    },
    [handlePointerMove, finishDrag],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const element = e.currentTarget as HTMLElement;

      // Store pending drag - actual drag starts when threshold is exceeded
      pendingDragRef.current = {
        startPosition: { x: e.clientX, y: e.clientY },
        element,
        pointerId: e.pointerId,
      };

      element.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      // Prevent default to avoid text selection during potential drag
      e.preventDefault();
    },
    [disabled, handlePointerMove, handlePointerUp],
  );

  const startKeyboardDrag = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      initializeDrag(
        element,
        {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
        'keyboard',
      );

      // Announce the enhanced grab message
      const itemName = announcedName ?? 'Item';
      announce(
        `${itemName} grabbed, use arrow keys to navigate to drop targets, press Escape to cancel`,
      );
    },
    [initializeDrag, announcedName, announce],
  );

  useEffect(() => () => updatePosition.cancel(), [updatePosition]);

  const setDragRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  const isDragging = dragMode !== 'none';

  const compatibleTargets = useMemo(() => {
    if (!isDragging) return [];
    return storeApi.getState().getCompatibleTargets();
  }, [isDragging, storeApi]);

  const navigateDropTargets = useCallback(
    (direction: 'next' | 'prev') => {
      if (compatibleTargets.length === 0) return;

      const nextIndex =
        direction === 'next'
          ? (currentDropTargetIndex + 1) % compatibleTargets.length
          : (currentDropTargetIndex - 1 + compatibleTargets.length) %
            compatibleTargets.length;

      setCurrentDropTargetIndex(nextIndex);
      const target = compatibleTargets[nextIndex];
      if (target) {
        updateDragPosition(
          target.x + target.width / 2,
          target.y + target.height / 2,
        );
        const description = getDropTargetDescription(
          nextIndex,
          compatibleTargets.length,
          target.announcedName,
        );
        announce(getKeyboardDragAnnouncement('navigate', description));
      }
    },
    [currentDropTargetIndex, updateDragPosition, announce, compatibleTargets],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      // During keyboard drag mode, handle navigation and stop propagation
      // to prevent selection handlers from firing
      if (dragMode === 'keyboard') {
        e.preventDefault();
        e.stopPropagation();
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            return navigateDropTargets('next');
          case 'ArrowUp':
          case 'ArrowLeft':
            return navigateDropTargets('prev');
          case 'Enter':
          case ' ':
            return finishDrag(true);
          case 'Escape':
            return finishDrag(false);
        }
        return;
      }

      // Initiate keyboard drag with Ctrl+D or Alt+Space
      // This avoids conflicts with Space/Enter used for selection
      const isCtrlD = e.ctrlKey && e.key.toLowerCase() === 'd';
      const isAltSpace = e.altKey && e.key === ' ';

      if (isCtrlD || isAltSpace) {
        e.preventDefault();
        e.stopPropagation();
        startKeyboardDrag(e.currentTarget as HTMLElement);
      } else if (e.key === 'Enter') {
        // Trigger click for selection - role="button" elements need this
        (e.currentTarget as HTMLElement).click();
      }
    },
    [disabled, dragMode, navigateDropTargets, finishDrag, startKeyboardDrag],
  );

  return useMemo(
    () => ({
      dragProps: {
        'ref': setDragRef,
        'onPointerDown': handlePointerDown,
        'onKeyDown': handleKeyDown,
        'role': 'button',
        'tabIndex': disabled ? -1 : 0,
        'aria-grabbed': isDragging,
        'aria-dropeffect': 'move',
        'aria-label': announcedName,
        'style': {
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          touchAction: isDragging ? 'none' : 'pan-y',
          userSelect: 'none',
        },
      },
      isDragging,
    }),
    [
      setDragRef,
      handlePointerDown,
      handleKeyDown,
      isDragging,
      disabled,
      announcedName,
    ],
  );
}
