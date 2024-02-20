import React, { useEffect, useRef, useState } from 'react';
import { throttle } from 'lodash';
import DragPreview from './DragPreview';
import DragManager, { VERTICAL_SCROLL } from './DragManager';
import { actionCreators as actions } from './reducer';
import store from './store';

const dragSource = (WrappedComponent) => {
  const getDisplayName = (WrappedComponent) => {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  };

  const DragSourceComponent = ({
    allowDrag = true,
    meta = () => ({}),
    scrollDirection = VERTICAL_SCROLL,
    preview,
    ...rest
  }) => {
    const node = useRef(null);
    const previewRef = useRef(null);
    const dragManagerRef = useRef(null);
    const previewElRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

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

    const createPreview = () => {
      if (!preview) {
        previewElRef.current = new DragPreview(node.current);
        return;
      }

      previewElRef.current = new DragPreview(previewRef.current);
    };

    const updatePreview = ({ x, y }) => {
      if (previewElRef.current) {
        previewElRef.current.position({ x, y });
      }
    };

    const setValidMove = (valid) => {
      if (previewElRef.current) {
        previewElRef.current.setValidMove(valid);
      }
    };

    const onDragStart = (movement) => {
      createPreview();

      store.dispatch(
        actions.dragStart({
          ...movement,
          meta: meta(),
        }),
      );

      setIsDragging(true);
    };

    const throttledDragAction = throttle(({ x, y, ...other }) => {
      store.dispatch(
        actions.dragMove({
          x,
          y,
          setValidMove,
          ...other,
        }),
      );
    }, 60);

    const onDragMove = ({ x, y, ...other }) => {
      updatePreview({ x, y });
      throttledDragAction({ x, y, ...other });
    };

    const onDragEnd = (movement) => {
      cleanupPreview();
      setIsDragging(false);

      store.dispatch(actions.dragEnd(movement));
    };

    useEffect(() => {
      if (node.current && allowDrag) {
        dragManagerRef.current = new DragManager({
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [node, allowDrag]);

    const styles = () => (isDragging ? { visibility: 'hidden' } : {});

    return (
      <div
        style={styles()}
        className={`draggable ${!allowDrag ? 'draggable--disabled' : ''}`}
        ref={node}
      >
        <WrappedComponent
          {...rest}
          allowDrag={allowDrag}
          scrollDirection={scrollDirection}
        />
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
      </div>
    );
  };

  DragSourceComponent.displayName = `DragSource(${getDisplayName(
    WrappedComponent,
  )})`;

  return DragSourceComponent;
};

export default dragSource;
