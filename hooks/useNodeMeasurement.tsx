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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.style.visibility = 'hidden';
    el.style.position = 'absolute';
    el.style.pointerEvents = 'none';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    setContainer(el);

    return () => {
      observerRef.current?.disconnect();
      document.body.removeChild(el);
      setContainer(null);
    };
  }, []);

  const portal = container
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
        container,
      )
    : null;

  return { ...dimensions, portal };
}
