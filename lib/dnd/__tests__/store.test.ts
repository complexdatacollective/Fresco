import { describe, it, expect, beforeEach } from 'vitest';
import { createDndStore, defaultInitState } from '../store';
import type { DropTarget } from '../types';

describe('DnD Store', () => {
  let store: ReturnType<typeof createDndStore>;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createDndStore(defaultInitState);
  });

  describe('startDrag', () => {
    it('should initialize drag state', () => {
      const dragItem = {
        id: 'drag-1',
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().startDrag(dragItem, position);

      const state = store.getState();
      expect(state.isDragging).toBe(true);
      expect(state.dragItem).toEqual(dragItem);
      expect(state.dragPosition).toEqual(position);
      expect(state.activeDropTargetId).toBe(null);
    });

    it('should update canDrop for compatible drop targets', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['test'],
      };

      const dragItem = {
        id: 'drag-1',
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);

      const state = store.getState();
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget?.canDrop).toBe(true);
    });
  });

  describe('updateDragPosition', () => {
    it('should update drag item position', () => {
      const dragItem = {
        id: 'drag-1',
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(150, 250);

      const state = store.getState();
      expect(state.dragPosition?.x).toBe(150);
      expect(state.dragPosition?.y).toBe(250);
    });

    it('should not update if no drag item', () => {
      store.getState().updateDragPosition(150, 250);
      const state = store.getState();
      expect(state.dragItem).toBe(null);
    });
  });

  describe('endDrag', () => {
    it('should clear drag state', () => {
      const dragItem = {
        id: 'drag-1',
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().startDrag(dragItem, position);
      store.getState().endDrag();

      const state = store.getState();
      expect(state.isDragging).toBe(false);
      expect(state.dragItem).toBe(null);
      expect(state.dragPosition).toBe(null);
      expect(state.activeDropTargetId).toBe(null);
    });

    it('should clear canDrop and isOver states', () => {
      const dropTarget: DropTarget = {
        id: 'drop-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['test'],
      };

      const dragItem = {
        id: 'drag-1',
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().endDrag();

      const state = store.getState();
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget?.canDrop).toBe(false);
      expect(storedTarget?.isOver).toBe(false);
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

      store.getState().registerDropTarget(dropTarget);

      const state = store.getState();
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget).toEqual({
        ...dropTarget,
        canDrop: false,
        isOver: false,
      });
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

      store.getState().registerDropTarget(dropTarget);
      store.getState().unregisterDropTarget('drop-1');

      const state = store.getState();
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

      store.getState().registerDropTarget(dropTarget);
      store.getState().setActiveDropTarget('drop-1');
      store.getState().unregisterDropTarget('drop-1');

      const state = store.getState();
      expect(state.activeDropTargetId).toBe(null);
    });
  });

  describe('hit detection', () => {
    it('should detect drop target at position and set isOver', () => {
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
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(100, 100);

      const state = store.getState();
      expect(state.activeDropTargetId).toBe('drop-1');
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget?.isOver).toBe(true);
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
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(100, 100);

      const state = store.getState();
      expect(state.activeDropTargetId).toBe(null);
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget?.isOver).toBe(false);
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
        type: 'test',
        metadata: { type: 'test' },
        _sourceZone: null,
      };

      const position = {
        x: 200,
        y: 200,
        width: 50,
        height: 50,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(200, 200);

      const state = store.getState();
      expect(state.activeDropTargetId).toBe(null);
      const storedTarget = state.dropTargets.get('drop-1');
      expect(storedTarget?.isOver).toBe(false);
    });
  });
});
