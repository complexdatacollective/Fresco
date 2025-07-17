// Accessibility utilities for drag and drop

export type KeyboardDragState = {
  isActive: boolean;
  targetIndex: number;
  dropTargets: string[];
}

// ARIA live region for announcements
let liveRegion: HTMLElement | null = null;

export function getOrCreateLiveRegion(): HTMLElement {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.padding = '0';
    liveRegion.style.margin = '-1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    liveRegion.style.whiteSpace = 'nowrap';
    liveRegion.style.border = '0';
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

export function announce(message: string): void {
  const region = getOrCreateLiveRegion();
  region.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (region.textContent === message) {
      region.textContent = '';
    }
  }, 1000);
}

export function cleanupLiveRegion(): void {
  if (liveRegion && liveRegion.parentNode) {
    liveRegion.parentNode.removeChild(liveRegion);
    liveRegion = null;
  }
}

// Keyboard navigation helpers
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
      return `Started dragging. ${details || ''} ${getDragInstructions()}`;
    case 'navigate':
      return details || 'Navigated to drop target';
    case 'drop':
      return `Dropped item. ${details || ''}`;
    case 'cancel':
      return 'Drag cancelled';
    default:
      return '';
  }
}
