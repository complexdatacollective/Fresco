'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

type NodeMeasurement = {
  nodeWidth: number;
  nodeHeight: number;
  portal: React.ReactPortal | null;
};

export function useNodeMeasurement({
  component,
}: {
  component: ReactElement;
}): NodeMeasurement {
  const [dimensions, setDimensions] = useState({ nodeWidth: 0, nodeHeight: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      observerRef.current?.disconnect();
      document.body.removeChild(container);
      containerRef.current = null;
    };
  }, []);

  const portal = containerRef.current
    ? createPortal(
        <div
          ref={(el) => {
            if (!el) return;
            observerRef.current?.disconnect();

            const observer = new ResizeObserver((entries) => {
              const entry = entries[0];
              if (!entry) return;
              const { width, height } = entry.contentRect;
              setDimensions((prev) => {
                if (prev.nodeWidth === width && prev.nodeHeight === height) {
                  return prev;
                }
                return { nodeWidth: width, nodeHeight: height };
              });
            });

            observer.observe(el);
            observerRef.current = observer;
          }}
          style={{ display: 'inline-block' }}
        >
          {component}
        </div>,
        containerRef.current,
      )
    : null;

  return { ...dimensions, portal };
}
