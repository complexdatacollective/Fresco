'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';
import { createPortal } from 'react-dom';

import { type DndStore, createDndStore } from './store';

export type DndStoreApi = ReturnType<typeof createDndStore>;

export const DndStoreContext = createContext<DndStoreApi | undefined>(
  undefined,
);

export type DndStoreProviderProps = {
  children: ReactNode;
};

export const DndStoreProvider = ({ children }: DndStoreProviderProps) => {
  const storeRef = useRef<DndStoreApi | null>(null);
  storeRef.current ??= createDndStore();

  return (
    <DndStoreContext.Provider value={storeRef.current}>
      {children}
      <DragPreview />
    </DndStoreContext.Provider>
  );
};

export const useDndStore = <T,>(selector: (store: DndStore) => T): T => {
  const dndStoreContext = useContext(DndStoreContext);

  if (!dndStoreContext) {
    throw new Error(`useDndStore must be used within DndStoreProvider`);
  }

  return useStore(dndStoreContext, selector);
};

// Expose the store API for advanced usage (subscribe, getState)
export const useDndStoreApi = () => {
  const dndStoreContext = useContext(DndStoreContext);

  if (!dndStoreContext) {
    throw new Error(`useDndStoreApi must be used within DndStoreProvider`);
  }

  return dndStoreContext;
};

// DragPreview component that renders into a portal
function DragPreview() {
  const dragPreview = useDndStore((state) => state.dragPreview);
  const dragPosition = useDndStore((state) => state.dragPosition);
  const dragItem = useDndStore((state) => state.dragItem);
  const isDragging = !!dragItem;

  if (!isDragging || !dragPreview || typeof document === 'undefined') {
    return null;
  }

  const previewStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 9999,
    left: 0,
    top: 0,
    transform: `translate(${dragPosition?.x ?? 0}px, ${dragPosition?.y ?? 0}px) translate(-50%, -50%)`,
  };

  return createPortal(
    <div style={previewStyles}>{dragPreview}</div>,
    document.body,
  );
}

// Re-export the DragPreview component for backward compatibility
export { DragPreview };
