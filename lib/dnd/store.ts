import { create } from 'zustand';
import { type ItemType } from './config';

export type DraggingItem = {
  type: ItemType;
  metaData?: Record<string, unknown>;
};

type DropZone = {
  type: string;
};

type DndState = {
  draggingItem: DraggingItem | null;
  setDraggingItem: (item: DraggingItem | null) => void;
  dropZones: DropZone[];
  addDropZone: (zone: DropZone) => void;
};

const useStore = create<DndState>((set) => ({
  draggingItem: null,
  setDraggingItem: (item) => set({ draggingItem: item }),
  dropZones: [],
  addDropZone: (zone) =>
    set((state) => ({ dropZones: [...state.dropZones, zone] })),
}));

export default useStore;
