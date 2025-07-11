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
    if (!sourceElement?.firstElementChild) return null;

    try {
      // Use dangerouslySetInnerHTML to clone the element content
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: sourceElement.firstElementChild.outerHTML,
          }}
        />
      );
    } catch (error) {
      // eslint-disable-next-line no-console
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

/**
 * Legacy class for backward compatibility.
 * @deprecated Use DragPreview React component instead
 */
export class DraggablePreview {
  private node: HTMLDivElement;
  private initialSize: Size;
  private validMove = true;
  private animationFrame?: number;
  private x = 0;
  private y = 0;
  private _center?: { x: number; y: number };

  constructor(sourceNode: HTMLElement) {
    // eslint-disable-next-line no-console
    console.warn(
      'DraggablePreview class is deprecated. Use DragPreview React component instead.',
    );

    this.node = document.createElement('div');
    this.initialSize = getElementSize(sourceNode);
    this.node.setAttribute('class', 'draggable-preview');

    this.update();

    const clone = sourceNode.firstChild?.cloneNode(true);
    if (clone) {
      this.node.appendChild(clone);
    }

    document.body.appendChild(this.node);
  }

  size(): Size {
    if (!this.node) {
      return { width: 0, height: 0 };
    }
    const element = this.node.firstChild as HTMLElement;
    if (!element) {
      return { width: 0, height: 0 };
    }
    return getElementSize(element);
  }

  center(): { x: number; y: number } {
    if (!this.node) {
      return { x: 0, y: 0 };
    }

    if (!this._center) {
      const size = this.size();
      this._center = {
        x: Math.floor(size.width / 2),
        y: Math.floor(size.height / 2),
      };
    }

    return this._center;
  }

  private update = (): void => {
    this.render();
    this.animationFrame = window.requestAnimationFrame(this.update);
  };

  private render(): void {
    const style = `
      width: ${this.initialSize.width}px;
      height: ${this.initialSize.height}px;
      display: inline-block;
      position: absolute;
      left: 0px;
      top: 0px;
      transform: translate(${this.x}px, ${this.y}px);
    `;

    this.node.setAttribute('style', style);

    if (this.validMove) {
      this.node.setAttribute('class', 'draggable-preview');
    } else {
      this.node.setAttribute(
        'class',
        'draggable-preview draggable-preview--invalid',
      );
    }
  }

  position(coords: { x: number; y: number }): void {
    this.x = coords.x - this.center().x;
    this.y = coords.y - this.center().y;
  }

  setValidMove(valid: boolean): void {
    this.validMove = valid;
  }

  cleanup(): void {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }
    if (this.node && document.body.contains(this.node)) {
      document.body.removeChild(this.node);
    }
  }
}
