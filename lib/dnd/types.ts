import { type ReactNode } from 'react';
import { z } from 'zod';

// Core drag metadata schema
export const DragMetadataSchema = z.record(z.unknown());
export type DragMetadata = z.infer<typeof DragMetadataSchema>;

// Drag item schema
export const DragItemSchema = z.object({
  id: z.string(),
  metadata: DragMetadataSchema,
});
export type DragItem = z.infer<typeof DragItemSchema>;

// Drop target schema
export const DropTargetSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  accepts: z.array(z.string()),
  zoneId: z.string().optional(),
});;
export type DropTarget = z.infer<typeof DropTargetSchema>;

// Drag state schema
export const DragStateSchema = z.object({
  dragItem: DragItemSchema.nullable(),
  dropTargets: z.map(z.string(), DropTargetSchema),
  activeDropTargetId: z.string().nullable(),
  isDragging: z.boolean(),
});
export type DragState = z.infer<typeof DragStateSchema>;

// Hook return types
export type UseDragSourceReturn = {
  dragProps: {
    'onPointerDown': (e: React.PointerEvent) => void;
    'onKeyDown': (e: React.KeyboardEvent) => void;
    'style'?: React.CSSProperties;
    'aria-grabbed'?: boolean;
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'role'?: string;
    'tabIndex'?: number;
  };
  isDragging: boolean;
};

export type UseDropTargetReturn = {
  dropProps: {
    'ref': (element: HTMLElement | null) => void;
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'data-drop-target'?: boolean;
    'style'?: React.CSSProperties;
    'tabIndex'?: number;
  };
  isOver: boolean;
  willAccept: boolean;
  isDragging: boolean;
};

// Drag preview props
export type DragPreviewProps = {
  children?: ReactNode;
  offset?: { x: number; y: number };
};

// Event callbacks
export type DragStartCallback = (metadata: DragMetadata) => void;
export type DragEndCallback = (
  metadata: DragMetadata,
  dropTargetId: string | null,
) => void;
export type DropCallback = (metadata: DragMetadata) => void;

// Configuration options
export type DragSourceOptions = {
  metadata: DragMetadata;
  preview?: ReactNode;
  onDragStart?: DragStartCallback;
  onDragEnd?: DragEndCallback;
  disabled?: boolean;
};

export type DropTargetOptions = {
  accepts: string[];
  zoneId?: string;
  onDrop?: DropCallback;
  onDragEnter?: (metadata: DragMetadata) => void;
  onDragLeave?: (metadata: DragMetadata) => void;
  disabled?: boolean;
};
