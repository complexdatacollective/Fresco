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

import {
  getDragInstructions,
  getDropTargetDescription,
  getKeyboardDragAnnouncement,
} from './accessibility';
import { useDndStore, useDndStoreApi } from './DndStoreProvider';
import { type DragMetadata } from './types';
import { useAccessibilityAnnouncements } from './useAccessibilityAnnouncements';
import { findSourceZone, rafThrottle } from './utils';

// Hook-specific types
export type DragSourceOptions = {
  type: string;
  metadata?: DragMetadata;
  announcedName?: string;
  preview?: ReactNode;
  disabled?: boolean;
};

export type UseDragSourceReturn = {
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

export function useDragSource(options: DragSourceOptions): UseDragSourceReturn {
  const { type, metadata, announcedName, preview, disabled = false } = options;
  const previewComponent = preview;

  const { announce } = useAccessibilityAnnouncements();

  const [dragMode, setDragMode] = useState<'none' | 'pointer' | 'keyboard'>(
    'none',
  );
  const [currentDropTargetIndex, setCurrentDropTargetIndex] = useState(-1);
  const dragId = useId();
  const elementRef = useRef<HTMLElement | null>(null);

  const startDrag = useDndStore((state) => state.startDrag);
  const updateDragPosition = useDndStore((state) => state.updateDragPosition);
  const endDrag = useDndStore((state) => state.endDrag);

  const updatePosition = useRef(rafThrottle(updateDragPosition)).current;

  const createPreview = useCallback(
    (element: HTMLElement | null): ReactNode => {
      if (previewComponent !== undefined) return previewComponent;
      if (!element) return null;

      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.pointerEvents = 'none';
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

      if (!shouldDrop) {
        storeApi.getState().setActiveDropTarget(null);
      }

      endDrag();
      setDragMode('none');
      setCurrentDropTargetIndex(-1);

      const element = elementRef.current;
      if (element) {
        element.style.visibility = 'visible'; // Restore visibility
      }

      // Announce keyboard drag result
      if (dragMode === 'keyboard') {
        announce(
          getKeyboardDragAnnouncement(
            shouldDrop && activeDropTargetId ? 'drop' : 'cancel',
          ),
        );
      }
    },
    [endDrag, dragMode, announce, storeApi],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      updatePosition(e.pageX, e.pageY);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      const element = elementRef.current;
      if (element?.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }
      finishDrag(true);
    },
    [handlePointerMove, finishDrag],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const element = e.currentTarget as HTMLElement;

      initializeDrag(element, { x: e.pageX, y: e.pageY }, 'pointer');

      element.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      // Prevent default to avoid text selection
      e.preventDefault();
    },
    [disabled, initializeDrag, handlePointerMove, handlePointerUp],
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

      // After drag starts, the store will have updated compatible targets
      // We need to get the count from the store
      const compatibleCount = storeApi.getState().getCompatibleTargets().length;

      const itemInfo = announcedName ? `${announcedName} ` : '';
      const zonesInfo = `${compatibleCount} compatible drop zones available.`;
      announce(
        getKeyboardDragAnnouncement(
          'start',
          `${itemInfo}${zonesInfo} ${getDragInstructions()}`,
        ),
      );
    },
    [initializeDrag, announcedName, announce, storeApi],
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

      if (dragMode === 'keyboard') {
        e.preventDefault();
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
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startKeyboardDrag(e.currentTarget as HTMLElement);
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
          touchAction: 'none',
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
