// Core types for drag and drop
export type DragMetadata = Record<string, unknown>;

export type DragItem = {
  id: string;
  type: string;
  metadata?: DragMetadata;
  _sourceZone: string | null;
};

export type DropTarget = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accepts: string[];
  announcedName?: string;
};

export type UseDropTargetReturn = {
  dropProps: {
    'ref': (element: HTMLElement | null) => void;
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'aria-label'?: string;
    'data-zone-id'?: string;
    'style'?: React.CSSProperties;
    'tabIndex'?: number;
  };
  isOver: boolean;
  willAccept: boolean;
  isDragging: boolean;
};

export type DropCallback = (metadata?: DragMetadata) => void;

export type DropTargetState = DropTarget & {
  canDrop: boolean;
  isOver: boolean;
};

export type HitDetector = (
  x: number,
  y: number,
  dropTargets: Map<string, DropTargetState>,
) => string | null;
