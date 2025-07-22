'use client';

import { type ReactNode, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';

import { type DndStore, createDndStore } from './store';

type DndStoreApi = ReturnType<typeof createDndStore>;

const DndStoreContext = createContext<DndStoreApi | undefined>(undefined);

type DndStoreProviderProps = {
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

export const useDndStoreApi = () => {
  const dndStoreContext = useContext(DndStoreContext);

  if (!dndStoreContext) {
    throw new Error(`useDndStoreApi must be used within DndStoreProvider`);
  }

  return dndStoreContext;
};

function DragPreview() {
  const dragPreview = useDndStore((state) => state.dragPreview);
  const dragPosition = useDndStore((state) => state.dragPosition);
  const dragItem = useDndStore((state) => state.dragItem);
  const isDragging = !!dragItem;

  if (!isDragging || !dragPreview || typeof document === 'undefined') {
    return null;
  }

  const previewStyles: React.CSSProperties = {
    transform: `translate(${dragPosition?.x ?? 0}px, ${dragPosition?.y ?? 0}px) translate(-50%, -50%)`,
  };

  return createPortal(
    <div
      style={previewStyles}
      className="pointer-events-none fixed top-0 left-0 z-[9999] select-none"
    >
      {dragPreview}
    </div>,
    document.body,
  );
}
