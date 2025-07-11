import type React from 'react';

export type DragSource = {
  meta: Record<string, unknown>;
  x: number;
  y: number;
}

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DropTargetState = {
  isOver: boolean;
  willAccept: boolean;
  bounds: Bounds;
}

export type DropTargetProps = {
  id: string;
  onDrop?: (item: DragSource) => void;
  onDrag?: (item: DragSource) => void;
  onDragEnd?: () => void;
  accepts?: (source: DragSource) => boolean;
  meta?: () => Record<string, unknown>;
  children: (ref: React.RefObject<HTMLElement>, state: DropTargetState) => React.ReactNode;
}

export type DropObstacleProps = {
  id: string;
  children: (ref: React.RefObject<HTMLElement>) => React.ReactNode;
}

export type DragSourceState = {
  isDragging: boolean;
  dragOffset: { x: number; y: number } | null;
  source: DragSource | null;
}

export type MonitorDropTargetState = {
  isOver: boolean;
  willAccept: boolean;
  source: DragSource | null;
}

export type MonitorDropTargetProps = {
  targetId: string;
  children: (state: MonitorDropTargetState) => React.ReactNode;
}

export type MonitorDragSourceState = {
  isDragging: boolean;
  dragOffset: { x: number; y: number } | null;
  source: DragSource | null;
}

export type MonitorDragSourceProps = {
  children: (state: MonitorDragSourceState) => React.ReactNode;
}

export type DragSourceProps = {
  allowDrag?: boolean;
  meta?: () => Record<string, unknown>;
  scrollDirection?: string;
  preview?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  children: (
    ref: React.RefObject<HTMLElement>, 
    state: DragSourceState,
    previewRef: React.RefObject<HTMLDivElement>
  ) => React.ReactNode;
}

