/**
 * Drag and Drop integration for Collection component.
 *
 * Provides optional DnD functionality via hooks injection pattern.
 * Integrates with the lib/dnd system.
 *
 * @module collection/dnd
 */

export { DropIndicator, type DropIndicatorProps } from './DropIndicator';
export { useCollectionItemDropTarget, useDragAndDrop } from './useDragAndDrop';
export type {
  DragAndDropHooks,
  DragAndDropOptions,
  DragItem,
  DroppableItemProps,
  DropPosition,
  DropTarget,
  ReorderEvent,
} from './types';
