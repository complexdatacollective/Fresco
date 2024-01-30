import React, { useCallback, useEffect, useRef, useState } from 'react';
import { throttle } from 'lodash';
import DragPreview from './DragPreview';
import DragManager, { VERTICAL_SCROLL } from './DragManager';
import { actionCreators as actions } from './reducer';
import store from './store';

const dragSource = (WrappedComponent) => {
  const DragSourceInner = ({
    allowDrag = true,
    meta = () => ({}),
    scrollDirection = VERTICAL_SCROLL,
    preview,
    onClick,
    ...rest
  }) => {
    const node = useRef();
    const previewRef = useRef();
    const dragManager = useRef(null);
    const previewEl = useRef(null);

    const [isDragging, setIsDragging] = useState(false);

    const cleanupDragManager = () => {
      if (dragManager.current) {
        dragManager.current.unmount();
        dragManager.current = null;
      }
    };

    const cleanupPreview = useCallback(() => {
      if (previewEl.current) {
        previewEl.current.cleanup();
        previewEl.current = null;
      }
    }, []);

    const createPreview = useCallback(() => {
      if (!preview) {
        previewEl.current = new DragPreview(node.current);
        return;
      }

      previewEl.current = new DragPreview(previewRef.current);
    }, [preview]);

    const updatePreview = useCallback(
      ({ x, y }) => {
        if (previewEl.current) {
          previewEl.current.position({ x, y });
        }
      },
      [previewEl],
    );

    const setValidMove = (valid) => {
      if (!previewEl.current) return;
      previewEl.current.setValidMove(valid);
    };

    const onDragStart = useCallback(
      (movement) => {
        createPreview();

        store.dispatch(
          actions.dragStart({
            ...movement,
            meta: meta(),
          }),
        );

        setIsDragging(true);
      },
      [createPreview, meta],
    );

    const throttledDragAction = throttle(({ x, y, ...other }) => {
      store.dispatch(
        actions.dragMove({
          x,
          y,
          setValidMove,
          ...other,
        }),
      );
    }, 250);

    const onDragMove = useCallback(
      ({ x, y, ...other }) => {
        updatePreview({ x, y });
        throttledDragAction({ x, y, ...other });
      },
      [throttledDragAction, updatePreview],
    );

    const onDragEnd = useCallback(
      (movement) => {
        cleanupPreview();
        setIsDragging(false);

        store.dispatch(actions.dragEnd(movement));
      },
      [cleanupPreview],
    );

    useEffect(() => {
      if (node.current && allowDrag) {
        dragManager.current = new DragManager({
          el: node.current,
          onDragStart,
          onDragMove,
          onDragEnd,
          scrollDirection,
        });
      }

      return () => {
        cleanupPreview();
        cleanupDragManager();
      };
    }, [
      node,
      allowDrag,
      cleanupPreview,
      onDragEnd,
      onDragMove,
      onDragStart,
      scrollDirection,
    ]);

    const styles = () => (isDragging ? { visibility: 'hidden' } : {});

    return (
      <>
        <div
          style={styles()}
          className={`draggable ${!allowDrag ? 'draggable--disabled' : ''}`}
          ref={node}
          onClick={onClick}
        >
          <WrappedComponent
            {...rest}
            allowDrag={allowDrag}
            scrollDirection={scrollDirection}
          />
        </div>
        {preview && (
          <div
            ref={previewRef}
            style={{
              display: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {preview}
          </div>
        )}
      </>
    );
  };

  return DragSourceInner;
};

export default dragSource;
