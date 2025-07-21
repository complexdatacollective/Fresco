import React, {
  createElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  getDragInstructions,
  getDropTargetDescription,
  getKeyboardDragAnnouncement,
} from './accessibility';
import { useDndStore } from './store';
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

  const dropTargets = useDndStore((s) => s.dropTargets);

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

  const beginDrag = useCallback(
    (element: HTMLElement, position: { x: number; y: number }) => {
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

      // Only hide the element during pointer drag, not keyboard drag
      // During keyboard drag, we need the element to stay visible and focused to receive events
      if (dragMode === 'pointer') {
        element.style.visibility = 'hidden';
      }
    },
    [dragId, type, metadata, createPreview, startDrag, dragMode],
  );

  const finishDrag = useCallback(() => {
    endDrag();
    setDragMode('none');
    setCurrentDropTargetIndex(-1);

    const element = elementRef.current;
    if (element) {
      element.style.visibility = 'visible'; // Restore visibility
    }
  }, [endDrag]);

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
      finishDrag();
    },
    [handlePointerMove, finishDrag],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const element = e.currentTarget as HTMLElement;
      elementRef.current = element;

      setDragMode('pointer');
      beginDrag(element, { x: e.pageX, y: e.pageY });

      element.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    },
    [disabled, beginDrag, handlePointerMove, handlePointerUp],
  );

  const endKeyboardDrag = useCallback(
    (shouldDrop: boolean) => {
      const activeDropTargetId = useDndStore.getState().activeDropTargetId;
      if (!shouldDrop) {
        useDndStore.getState().setActiveDropTarget(null);
      }
      finishDrag();
      announce(
        getKeyboardDragAnnouncement(
          shouldDrop && activeDropTargetId ? 'drop' : 'cancel',
        ),
      );
    },
    [finishDrag, announce],
  );

  const startKeyboardDrag = useCallback(
    (element: HTMLElement) => {
      elementRef.current = element;
      setDragMode('keyboard');
      const rect = element.getBoundingClientRect();
      beginDrag(element, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      // dropTargets is always a Map
      const targets = Array.from(dropTargets.values());

      const currentCompatibleTargets = targets.filter((target) => {
        const acceptsType = target.accepts.includes(type);
        const notSourceZone = !target.id || dragId !== target.id;
        return acceptsType && notSourceZone;
      });

      const itemInfo = announcedName ? `${announcedName} ` : '';
      const zonesInfo = `${currentCompatibleTargets.length} compatible drop zones available.`;
      announce(
        getKeyboardDragAnnouncement(
          'start',
          `${itemInfo}${zonesInfo} ${getDragInstructions()}`,
        ),
      );
    },
    [beginDrag, announcedName, announce, type, dropTargets, dragId],
  );

  useEffect(() => () => updatePosition.cancel(), [updatePosition]);

  const setDragRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  const isDragging = dragMode !== 'none';

  const compatibleTargets = useMemo(() => {
    if (!isDragging) return [];

    const itemType = type;
    if (typeof itemType !== 'string') return [];

    // dropTargets is always a Map
    const targets = Array.from(dropTargets.values());

    return targets.filter((target) => {
      const acceptsType = target.accepts.includes(itemType);
      const notSourceZone = !target.id || dragId !== target.id;
      return acceptsType && notSourceZone;
    });
  }, [isDragging, type, dragId, dropTargets]);

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
            return endKeyboardDrag(true);
          case 'Escape':
            return endKeyboardDrag(false);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startKeyboardDrag(e.currentTarget as HTMLElement);
      }
    },
    [
      disabled,
      dragMode,
      navigateDropTargets,
      endKeyboardDrag,
      startKeyboardDrag,
    ],
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

// A constant for the static styles
const previewStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 9999,
  // Set left/top to 0, as we will position exclusively with transform
  left: 0,
  top: 0,
};

export function DragPreview() {
  const dragPreview = useDndStore((state) => state.dragPreview);
  const dragPosition = useDndStore((state) => state.dragPosition);
  const dragItem = useDndStore((state) => state.dragItem);
  const isDragging = !!dragItem;

  // Memoize the dynamic part of the style so the object reference is stable
  // if the position hasn't changed.
  const transformStyle = useMemo(
    () => ({
      transform: `translate(${dragPosition?.x ?? 0}px, ${dragPosition?.y ?? 0}px) translate(-50%, -50%)`,
    }),
    [dragPosition],
  );

  if (!isDragging || !dragPreview) {
    return null;
  }

  return createPortal(
    <div
      style={{
        ...previewStyles, // Use the static styles
        ...transformStyle, // Apply the dynamic transform
      }}
    >
      {dragPreview}
    </div>,
    document.body,
  );
}
