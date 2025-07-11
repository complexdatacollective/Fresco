import { throttle } from 'es-toolkit';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DragManager, { VERTICAL_SCROLL } from './DragManager';
import { DragPreview } from './DragPreview';
import { actionCreators as actions } from './reducer';
import store from './store';
import { type DragSourceProps, type DragSourceState } from './types';
import { validateElementRef } from './utils/domValidation';

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
  const [previewData, setPreviewData] = useState<{
    sourceElement: HTMLElement;
    x: number;
    y: number;
    isValidMove: boolean;
    show: boolean;
  } | null>(null);
  const [triggerSetup, setTriggerSetup] = useState(0);
  const [dragState, setDragState] = useState<DragSourceState>({
    isDragging: false,
    dragOffset: null,
    source: null,
  });

  // Custom ref that triggers setup when attached
  const customRef = useMemo(() => {
    const ref = {
      get current() {
        return nodeRef.current;
      },
      set current(value: HTMLElement | null) {
        nodeRef.current = value;
        // Trigger setup when ref changes
        setTriggerSetup((prev) => prev + 1);
      },
    };
    return ref as React.RefObject<HTMLElement>;
  }, []);

  const cleanupDragManager = () => {
    if (dragManagerRef.current) {
      dragManagerRef.current.unmount();
      dragManagerRef.current = null;
    }
  };

  const cleanupPreview = () => {
    setPreviewData(null);
  };

  const createPreview = useCallback(
    (x: number, y: number) => {
      const element = validateElementRef(nodeRef, 'useDragSource');
      if (!element) return;

      const sourceElement =
        preview && previewRef.current ? previewRef.current : element;

      setPreviewData({
        sourceElement,
        x,
        y,
        isValidMove: true,
        show: true,
      });
    },
    [preview],
  );

  const updatePreview = ({ x, y }: { x: number; y: number }) => {
    setPreviewData((prev) => (prev ? { ...prev, x, y } : null));
  };

  const setValidMove = (valid: boolean) => {
    setPreviewData((prev) => (prev ? { ...prev, isValidMove: valid } : null));
  };

  const onDragStart = useCallback(
    (movement: DragMovement) => {
      createPreview(movement.x, movement.y);

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
  }, [
    triggerSetup,
    allowDrag,
    scrollDirection,
    onDragStart,
    onDragMove,
    onDragEnd,
  ]);

  const dragStyles = dragState.isDragging ? { visibility: 'hidden' } : {};

  return {
    nodeRef: customRef,
    previewRef,
    state: dragState,
    preview:
      previewData?.show && previewData.sourceElement ? (
        <DragPreview
          sourceElement={previewData.sourceElement}
          x={previewData.x}
          y={previewData.y}
          isValidMove={previewData.isValidMove}
        >
          {preview}
        </DragPreview>
      ) : null,
    dragStyles,
  };
};

// Render prop component
export const DragSource: React.FC<DragSourceProps> = ({
  children,
  ...props
}) => {
  const { nodeRef, previewRef, state, preview } = useDragSource(props);
  return (
    <>
      {children(nodeRef, state, previewRef)}
      {preview}
    </>
  );
};
