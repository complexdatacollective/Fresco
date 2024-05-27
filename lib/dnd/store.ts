import { create } from 'zustand';

type DraggingItem = {
  id: string;
  type: string;
};

type DropZone = {
  id: string;
  type: string;
};

type Obstacle = {
  id: string;
  type: string;
};

type DndState = {
  draggingItem: DraggingItem | null;
  setDraggingItem: (item: DraggingItem | null) => void;
  dropZones: DropZone[];
  addDropZone: (zone: DropZone) => void;
  obstacles: Obstacle[];
  addObstacle: (obstacle: Obstacle) => void;
};

const useStore = create<DndState>((set) => ({
  draggingItem: null,
  setDraggingItem: (item) => set({ draggingItem: item }),
  dropZones: [],
  addDropZone: (zone) =>
    set((state) => ({ dropZones: [...state.dropZones, zone] })),
  obstacles: [],
  addObstacle: (obstacle) =>
    set((state) => ({ obstacles: [...state.obstacles, obstacle] })),
}));

export default useStore;
