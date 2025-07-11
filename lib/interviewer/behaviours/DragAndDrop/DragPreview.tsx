import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { validateElementRef } from './utils/domValidation';

type DragPreviewProps = {
  sourceElement: HTMLElement;
  x: number;
  y: number;
  isValidMove: boolean;
  children?: React.ReactNode;
};

type Size = {
  width: number;
  height: number;
};

const getElementSize = (element: HTMLElement): Size => {
  const boundingRect = getAbsoluteBoundingRect(element);
  if (!boundingRect) {
    return { width: 0, height: 0 };
  }

  return {
    width: Math.floor(boundingRect.width),
    height: Math.floor(boundingRect.height),
  };
};

/**
 * Modern React component for drag preview using createPortal instead of direct DOM manipulation.
 * Replaces the old class-based DragPreview that used manual DOM manipulation and polling.
 */
export const DragPreview: React.FC<DragPreviewProps> = ({
  sourceElement,
  x,
  y,
  isValidMove,
  children,
}) => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  // Calculate size when sourceElement changes
  useEffect(() => {
    if (!validateElementRef({ current: sourceElement }, 'DragPreview')) return;

    const elementSize = getElementSize(sourceElement);
    setSize(elementSize);
  }, [sourceElement]);

  // Calculate center point for positioning
  const center = useMemo(
    () => ({
      x: Math.floor(size.width / 2),
      y: Math.floor(size.height / 2),
    }),
    [size],
  );

  // Calculate final position
  const position = useMemo(
    () => ({
      x: x - center.x,
      y: y - center.y,
    }),
    [x, y, center],
  );

  const style: React.CSSProperties = {
    width: size.width,
    height: size.height,
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${position.x}px, ${position.y}px)`,
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'inline-block',
  };

  const className = isValidMove
    ? 'draggable-preview'
    : 'draggable-preview draggable-preview--invalid';

  // Default content: clone the first child of the source element
  const defaultContent = useMemo(() => {
    if (!sourceElement) return null;

    try {
      // Clone the entire source element, not just the first child
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: sourceElement.outerHTML,
          }}
        />
      );
    } catch (error) {
      console.warn('Failed to clone source element content:', error);
      return null;
    }
  }, [sourceElement]);

  const content = children ?? defaultContent;

  // Use createPortal to render into document.body
  return createPortal(
    <div className={className} style={style}>
      {content}
    </div>,
    document.body,
  );
};
