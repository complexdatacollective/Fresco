import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDndStore, resetBSPTree } from '../store';
import type { DropTarget } from '../types';

// Import setup
import './setup';

describe('Drag and Drop Hooks Integration', () => {
  beforeEach(() => {
    // Reset store state
    useDndStore.setState({
      dragItem: null,
      dragPosition: null,
      dropTargets: new Map(),
      activeDropTargetId: null,
      isDragging: false,
    });
    
    // Reset BSP tree
    resetBSPTree();
    
    vi.clearAllMocks();
  });

  describe('Store Integration', () => {
    it('should handle drag lifecycle', () => {
      const dragItem = {
        id: 'test-drag',
        metadata: { type: 'test', id: '1' },
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem, position);

      expect(useDndStore.getState().isDragging).toBe(true);
      expect(useDndStore.getState().dragItem).toEqual(dragItem);
      expect(useDndStore.getState().dragPosition).toEqual(position);

      useDndStore.getState().endDrag();

      expect(useDndStore.getState().isDragging).toBe(false);
      expect(useDndStore.getState().dragItem).toBe(null);
      expect(useDndStore.getState().dragPosition).toBe(null);
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

      useDndStore.getState().registerDropTarget(dropTarget);

      expect(useDndStore.getState().dropTargets.has('test-target')).toBe(true);

      useDndStore.getState().unregisterDropTarget('test-target');

      expect(useDndStore.getState().dropTargets.has('test-target')).toBe(false);
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
        metadata: { type: 'fruit', id: 'apple-1' },
      };

      const position = {
        x: 50,
        y: 50,
        width: 30,
        height: 30,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().updateDragPosition(50, 50);

      // Should set active drop target for accepted type
      expect(useDndStore.getState().activeDropTargetId).toBe('fruit-target');
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
        metadata: { type: 'vegetable', id: 'carrot-1' },
      };

      const position = {
        x: 50,
        y: 50,
        width: 30,
        height: 30,
      };

      useDndStore.getState().registerDropTarget(dropTarget);
      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().updateDragPosition(50, 50);

      // Should not set active drop target for rejected type
      expect(useDndStore.getState().activeDropTargetId).toBe(null);
    });

    it('should handle BSP tree reset correctly', () => {
      const dropTarget: DropTarget = {
        id: 'test-target',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        accepts: ['test'],
      };

      // Register a drop target
      useDndStore.getState().registerDropTarget(dropTarget);
      
      // Reset BSP tree
      resetBSPTree();
      
      // Re-register after reset should work
      useDndStore.getState().registerDropTarget({
        ...dropTarget,
        id: 'test-target-2'
      });
      
      expect(useDndStore.getState().dropTargets.has('test-target-2')).toBe(true);
    });

    it('should update drag position correctly', () => {
      const dragItem = {
        id: 'test-item',
        metadata: { type: 'test', id: '1' },
      };

      const position = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      };

      useDndStore.getState().startDrag(dragItem, position);
      useDndStore.getState().updateDragPosition(100, 200);

      const currentDragPosition = useDndStore.getState().dragPosition;
      expect(currentDragPosition?.x).toBe(100);
      expect(currentDragPosition?.y).toBe(200);
      expect(currentDragPosition?.width).toBe(50);
      expect(currentDragPosition?.height).toBe(50);
    });
  });
});