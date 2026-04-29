import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDndStore, defaultInitState } from '../store';
import type { DropTarget } from '../types';
import { boundsHitDetector } from '../utils';

// Import setup
import './setup';

describe('Drag and Drop Hooks Integration', () => {
  let store: ReturnType<typeof createDndStore>;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createDndStore(defaultInitState, boundsHitDetector);
    vi.clearAllMocks();
  });

  describe('Store Integration', () => {
    it('should handle drag lifecycle', () => {
      const dragItem = {
        id: 'test-drag',
        type: 'test',
        metadata: { type: 'test', id: '1' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      store.getState().startDrag(dragItem, position);

      expect(store.getState().isDragging).toBe(true);
      expect(store.getState().dragItem).toEqual(dragItem);
      expect(store.getState().dragPosition).toEqual(position);

      store.getState().endDrag();

      expect(store.getState().isDragging).toBe(false);
      expect(store.getState().dragItem).toBe(null);
      expect(store.getState().dragPosition).toBe(null);
    });

    it('should register and unregister drop targets', () => {
      const dropTarget: DropTarget = {
        id: 'test-target',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['test'],
      };

      store.getState().registerDropTarget(dropTarget);

      expect(store.getState().dropTargets.has('test-target')).toBe(true);

      store.getState().unregisterDropTarget('test-target');

      expect(store.getState().dropTargets.has('test-target')).toBe(false);
    });

    it('should handle drag type acceptance correctly', () => {
      const dropTarget: DropTarget = {
        id: 'fruit-target',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['fruit'],
      };

      const dragItem = {
        id: 'apple',
        type: 'fruit',
        metadata: { type: 'fruit', id: 'apple-1' },
        _sourceZone: null,
      };

      const position = {
        x: 50,
        y: 50,
        width: 30,
        height: 30,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(50, 50);

      // Should set active drop target for accepted type
      expect(store.getState().activeDropTargetId).toBe('fruit-target');
    });

    it('should not set active drop target for rejected types', () => {
      const dropTarget: DropTarget = {
        id: 'fruit-target',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['fruit'],
      };

      const dragItem = {
        id: 'carrot',
        type: 'vegetable',
        metadata: { type: 'vegetable', id: 'carrot-1' },
        _sourceZone: null,
      };

      const position = {
        x: 50,
        y: 50,
        width: 30,
        height: 30,
      };

      store.getState().registerDropTarget(dropTarget);
      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(50, 50);

      // Should not set active drop target for rejected type
      expect(store.getState().activeDropTargetId).toBe(null);
    });

    it('should update drag position correctly', () => {
      const dragItem = {
        id: 'test-item',
        type: 'test',
        metadata: { type: 'test', id: '1' },
        _sourceZone: null,
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      store.getState().startDrag(dragItem, position);
      store.getState().updateDragPosition(100, 200);

      const currentDragPosition = store.getState().dragPosition;
      expect(currentDragPosition?.x).toBe(100);
      expect(currentDragPosition?.y).toBe(200);
      expect(currentDragPosition?.width).toBe(50);
      expect(currentDragPosition?.height).toBe(50);
    });
  });
});
