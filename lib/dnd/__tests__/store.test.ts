import { describe, it, expect, beforeEach } from 'vitest';
import { useDndStore, resetBSPTree } from '../store';
import type { DropTarget } from '../types';

describe('DnD Store', () => {
  beforeEach(() => {
    // Reset store state
    useDndStore.setState({
      dragItem: null,
      dragPosition: null,
      dropTargets: new Map(),
      activeDropTargetId: null,
      isDragging: false,
    });

    // Reset BSP tree to fix isolation issues
    resetBSPTree();
  });

  describe('startDrag', () => {
    it('should initialize drag state', () => {
      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem, position);

      const state = useDndStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.dragItem).toEqual(dragItem);
      expect(state.dragPosition).toEqual(position);
      expect(state.activeDropTargetId).toBe(null);
    });
  });

  describe('updateDragPosition', () => {
    it('should update drag item position', () => {
      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().updateDragPosition(150, 250);

      const state = useDndStore.getState();
      expect(state.dragPosition?.x).toBe(150);
      expect(state.dragPosition?.y).toBe(250);
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
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().endDrag();

      const state = useDndStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.dragItem).toBe(null);
      expect(state.dragPosition).toBe(null);
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
        accepts: ['test'],
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
        accepts: ['test'],
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
        accepts: ['test'],
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
        accepts: ['test'],
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem, position);
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
        accepts: ['other'],
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem, position);
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
        accepts: ['test'],
      };

      const dragItem = {
        id: 'drag-1',
        metadata: { type: 'test' },
      };

      const position = {
        x: 200,
        y: 200,
        width: 50,
        height: 50,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().updateDragPosition(200, 200);

      const state = useDndStore.getState();
      expect(state.activeDropTargetId).toBe(null);
    });
  });
});
