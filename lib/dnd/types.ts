import { type ReactNode } from 'react';
import { z } from 'zod';

// Core drag metadata schema
export const DragMetadataSchema = z.record(z.unknown());
export type DragMetadata = z.infer<typeof DragMetadataSchema>;

// Drag item schema
export const DragItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  metadata: DragMetadataSchema.optional(),
  _sourceZone: z.string().nullable(),
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
  announcedName: z.string().optional(),
});
export type DropTarget = z.infer<typeof DropTargetSchema>;

// Drag state schema
export const DragStateSchema = z.object({
  dragItem: DragItemSchema.nullable(),
  dropTargets: z.map(z.string(), DropTargetSchema),
  activeDropTargetId: z.string().nullable(),
  isDragging: z.boolean(),
  dragPreview: z.any().nullable(), // ReactNode for custom preview
});
export type DragState = z.infer<typeof DragStateSchema>;

// Hook return types
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

// Drag preview props
export type DragPreviewProps = {
  children?: ReactNode;
  offset?: { x: number; y: number };
};

// Event callbacks
export type DragStartCallback = (metadata?: DragMetadata) => void;
export type DragEndCallback = (
  metadata: DragMetadata,
  dropTargetId: string | null,
) => void;
export type DropCallback = (metadata?: DragMetadata) => void;

// Configuration options
export type DragSourceOptions = {
  type: string; // Type of the drag item
  metadata?: DragMetadata;
  announcedName?: string; // Human-readable name for screen reader announcements
  preview?: ReactNode;
  onDragStart?: DragStartCallback;
  onDragEnd?: DragEndCallback;
  disabled?: boolean;
};
