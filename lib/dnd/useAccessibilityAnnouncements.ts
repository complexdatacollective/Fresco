import { useCallback, useEffect, useRef } from 'react';

export type KeyboardDragState = {
  isActive: boolean;
  targetIndex: number;
  dropTargets: string[];
};

/**
 * Custom hook for managing accessibility announcements in drag and drop operations.
 * Creates and manages an ARIA live region that is properly cleaned up with React's lifecycle.
 */
export function useAccessibilityAnnouncements() {
  const liveRegionRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Create the live region on mount
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');

      // Visually hidden but accessible to screen readers
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.padding = '0';
      liveRegion.style.margin = '-1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clipPath = 'inset(0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';

      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    // Cleanup on unmount
    return () => {
      if (liveRegionRef.current?.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string): void => {
    const region = liveRegionRef.current;
    if (!region) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    region.textContent = message;

    // Clear after announcement to allow repeated announcements of the same message
    timeoutRef.current = window.setTimeout(() => {
      if (region.textContent === message) {
        region.textContent = '';
      }
      timeoutRef.current = null;
    }, 1000);
  }, []);

  return { announce };
}

// Keyboard navigation helpers (kept as pure functions)
export function getDropTargetDescription(
  index: number,
  total: number,
  targetName?: string,
): string {
  if (targetName) {
    return `Drop target ${index + 1} of ${total}: ${targetName}`;
  }
  return `Drop target ${index + 1} of ${total}`;
}

export function getDragInstructions(): string {
  return 'Press Space or Enter to start dragging. Use arrow keys to navigate between drop targets. Press Space or Enter to drop. Press Escape to cancel.';
}

export function getKeyboardDragAnnouncement(
  action: 'start' | 'navigate' | 'drop' | 'cancel',
  details?: string,
): string {
  switch (action) {
    case 'start':
      return `Started dragging. ${details ?? ''} ${getDragInstructions()}`;
    case 'navigate':
      return details ?? 'Navigated to drop target';
    case 'drop':
      return `Dropped item. ${details ?? ''}`;
    case 'cancel':
      return 'Drag cancelled';
    default:
      return '';
  }
}
