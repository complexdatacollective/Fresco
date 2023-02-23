import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// import DragManager from './DragManager';

const DefaultDragPreview = (props) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: 200,
      width: 200,
      background: 'Tomato',
    }}
  >
    <h4>Drag Preview</h4>
  </div>
);

const makePreview = (Component) => {
  // This should render the component but constrained by its current
  // width and height
  return (<Component />)
}

const TYPES = {
  CARD: Symbol('CARD'),
};

const makeDraggable = (WrappedComponent) => ({
  // allowDrag = true,
  // meta = () => ({}),
  preview = DefaultDragPreview,
  type = TYPES['CARD'],
  ...rest
}) => {
  const wrappedComponentRef = useRef();
  const previewRef = useRef();
  const [isDragging, setIsDragging] = useState(false);

  const updatePreview = (x, y) => {
    if (previewRef.current) {
      previewRef.current.style.top = x;
      previewRef.current.style.left = y;
    }
  };

  const handleDragStart = (event) => {
    // event.preventDefault();
    // console.log('handleDragStart', event);
    // setIsDragging(true);
  };

  // const throttledDragAction = throttle(({ x, y, ...other }) => {
  //   store.dispatch(
  //     actions.dragMove({
  //       x, y, setValidMove, ...other,
  //     }),
  //   );
  // }, 60);

  const handleDragMove = (event) => {
    event.preventDefault();
    setIsDragging(true);

    const x = event.clientX;
    const y = event.clientY;
    console.log('handleDragMove', x, y);
    updatePreview(x, y);
  };

  const handleDragEnd = (event) => {
    console.log('handleDragEnd', event);
    setIsDragging(false);
  };

  // useEffect(() => {
  //   if (wrappedComponentRef.current && allowDrag) {
  //     // dragManager = new DragManager({
  //     //   el: wrappedComponentRef.current,
  //     //   onDragStart,
  //     //   onDragMove,
  //     //   onDragEnd,
  //     //   scrollDirection,
  //     // });
  //   }

  //   return () => {
  //     cleanupPreview();
  //     cleanupDragManager();
  //   };
  // }, [wrappedComponentRef]);

  const styles = () => (isDragging ? { visibility: 'hidden' } : {});

  const Preview = (
    <div
      className="draggable-preview"
      ref={previewRef}
    >
      {preview()}
    </div>
  );

  return (
    <>
      <div
        style={{
          ...styles(), cursor: 'pointer',
        }}
        draggable="true"
        className="draggable"
        ref={wrappedComponentRef}
        // onDragStart={handleDragStart}
        onDrag={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <WrappedComponent {...rest} />
      </div>
      { (preview && isDragging) && createPortal(Preview, document.body)}
    </>
  );
};

export default makeDraggable;
