import { describe, it, expect, beforeEach } from 'vitest';
import { useDndStore } from '../store';
import type { DragItem, DropTarget } from '../types';

describe('DnD Store', () => {
  beforeEach(() => {
    // Reset store state
    useDndStore.setState({
      dragItem: null,
      dropTargets: new Map(),
      activeDropTargetId: null,
      isDragging: false,
    });

    // Clear all drop targets to reset BSP tree
    const state = useDndStore.getState();
    const targetIds = Array.from(state.dropTargets.keys());
    targetIds.forEach((id) => {
      useDndStore.getState().unregisterDropTarget(id);
    });
  });

  describe('startDrag', () => {
    it('should initialize drag state', () => {
      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem);

      const state = useDndStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.dragItem).toEqual({
        ...dragItem,
        startX: 100,
        startY: 200,
      });
      expect(state.activeDropTargetId).toBe(null);
    });
  });

  describe('updateDragPosition', () => {
    it('should update drag item position', () => {
      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem);
      useDndStore.getState().updateDragPosition(150, 250);

      const state = useDndStore.getState();
      expect(state.dragItem?.x).toBe(150);
      expect(state.dragItem?.y).toBe(250);
    });

    it('should not update if no drag item', () => {
      useDndStore.getState().updateDragPosition(150, 250);
      const state = useDndStore.getState();
      expect(state.dragItem).toBe(null);
    });
  });

  describe('endDrag', () => {
    it('should clear drag state', () => {
      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem);
      useDndStore.getState().endDrag();

      const state = useDndStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.dragItem).toBe(null);
      expect(state.activeDropTargetId).toBe(null);
    });
  });

  describe('registerDropTarget', () => {
    it('should add drop target to store', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: () => true,
      };

      useDndStore.getState().registerDropTarget(dropTarget);

      const state = useDndStore.getState();
      expect(state.dropTargets.get('drop-1')).toEqual(dropTarget);
    });
  });

  describe('unregisterDropTarget', () => {
    it('should remove drop target from store', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: () => true,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().unregisterDropTarget('drop-1');

      const state = useDndStore.getState();
      expect(state.dropTargets.has('drop-1')).toBe(false);
    });

    it('should clear activeDropTargetId if it matches', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: () => true,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().setActiveDropTarget('drop-1');
      useDndStore.getState().unregisterDropTarget('drop-1');

      const state = useDndStore.getState();
      expect(state.activeDropTargetId).toBe(null);
    });
  });

  describe('hit detection', () => {
    it('should detect drop target at position', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        accepts: () => true,
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem);
      useDndStore.getState().updateDragPosition(100, 100);

      const state = useDndStore.getState();
      expect(state.activeDropTargetId).toBe('drop-1');
    });

    it('should not set activeDropTargetId if target does not accept', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        accepts: () => false,
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem);
      useDndStore.getState().updateDragPosition(100, 100);

      const state = useDndStore.getState();
      expect(state.activeDropTargetId).toBe(null);
    });

    it('should not set activeDropTargetId if point is outside target', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        accepts: () => true,
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
        x: 200,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem);
      useDndStore.getState().updateDragPosition(200, 200);

      const state = useDndStore.getState();
      expect(state.activeDropTargetId).toBe(null);
    });
  });
});
