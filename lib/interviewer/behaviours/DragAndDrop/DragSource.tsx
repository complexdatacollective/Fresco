import { throttle } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import DragManager, { VERTICAL_SCROLL } from './DragManager';
import { DraggablePreview } from './DragPreview';
import { validateElementRef } from './utils/domValidation';
import { actionCreators as actions } from './reducer';
import store from './store';
import { type DragSourceProps, type DragSourceState } from './types';

type DragMovement = {
  x: number;
  y: number;
  [key: string]: unknown;
};

export const useDragSource = (props: Omit<DragSourceProps, 'children'>) => {
  const {
    allowDrag = true,
    meta = () => ({}),
    scrollDirection = VERTICAL_SCROLL,
    preview,
  } = props;

  const nodeRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragManagerRef = useRef<DragManager | null>(null);
  const previewElRef = useRef<DraggablePreview | null>(null);
  const [triggerSetup, setTriggerSetup] = useState(0);
  const [dragState, setDragState] = useState<DragSourceState>({
    isDragging: false,
    dragOffset: null,
    source: null,
  });

  // Custom ref that triggers setup when attached
  const customRef = useMemo(() => {
    const ref: React.RefObject<HTMLElement> = {
      get current() {
        return nodeRef.current;
      },
      set current(value) {
        nodeRef.current = value;
        // Trigger setup when ref changes
        setTriggerSetup(prev => prev + 1);
      }
    };
    return ref;
  }, []);

  const cleanupDragManager = () => {
    if (dragManagerRef.current) {
      dragManagerRef.current.unmount();
      dragManagerRef.current = null;
    }
  };

  const cleanupPreview = () => {
    if (previewElRef.current) {
      previewElRef.current.cleanup();
      previewElRef.current = null;
    }
  };

  const createPreview = useCallback(() => {
    const element = validateElementRef(nodeRef, 'useDragSource');
    if (!element) return;

    if (!preview) {
      previewElRef.current = new DraggablePreview(element);
      return;
    }

    if (previewRef.current) {
      previewElRef.current = new DraggablePreview(previewRef.current);
    }
  }, [preview]);

  const updatePreview = ({ x, y }: { x: number; y: number }) => {
    if (previewElRef.current) {
      previewElRef.current.position({ x, y });
    }
  };

  const setValidMove = (valid: boolean) => {
    if (previewElRef.current) {
      previewElRef.current.setValidMove(valid);
    }
  };

  const onDragStart = useCallback(
    (movement: DragMovement) => {
      createPreview();

      const source = {
        ...movement,
        meta: meta(),
      };

      store.dispatch(actions.dragStart(source));

      setDragState({
        isDragging: true,
        dragOffset: { x: movement.x, y: movement.y },
        source,
      });
    },
    [createPreview, meta],
  );

  const throttledDragActionRef = useRef(
    throttle(({ x, y, ...other }: DragMovement) => {
      store.dispatch(
        actions.dragMove({
          x,
          y,
          setValidMove,
          ...other,
        }),
      );
    }, 60),
  );

  const onDragMove = useCallback(({ x, y, ...other }: DragMovement) => {
    updatePreview({ x, y });
    throttledDragActionRef.current({ x, y, ...other });
  }, []);

  const onDragEnd = useCallback((movement: DragMovement) => {
    cleanupPreview();
    
    setDragState({
      isDragging: false,
      dragOffset: null,
      source: null,
    });
    
    store.dispatch(actions.dragEnd(movement));
  }, []);

  // Set up drag manager when element becomes available
  useEffect(() => {
    if (!allowDrag) return;
    
    const validatedElement = validateElementRef(nodeRef, 'useDragSource');
    if (!validatedElement) return;

    dragManagerRef.current = new DragManager({
      el: validatedElement,
      onDragStart,
      onDragMove,
      onDragEnd,
      scrollDirection,
    });

    return () => {
      cleanupPreview();
      cleanupDragManager();
    };
  }, [triggerSetup, allowDrag, scrollDirection, onDragStart, onDragMove, onDragEnd]);

  return {
    nodeRef: customRef,
    previewRef,
    state: dragState,
  };
};

// Render prop component
export const DragSource: React.FC<DragSourceProps> = ({ children, ...props }) => {
  const { nodeRef, previewRef, state } = useDragSource(props);
  return <>{children(nodeRef, state, previewRef)}</>;
};

