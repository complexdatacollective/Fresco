'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

type NodeMeasurement = {
  nodeWidth: number;
  nodeHeight: number;
};

export function useNodeMeasurement({
  component,
}: {
  component: ReactElement;
}): NodeMeasurement {
  const [dimensions, setDimensions] = useState({ nodeWidth: 0, nodeHeight: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    containerRef.current = container;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    container.appendChild(wrapper);
    wrapperRef.current = wrapper;

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
    observer.observe(wrapper);
    observerRef.current = observer;

    rootRef.current = createRoot(wrapper);

    return () => {
      observer.disconnect();
      observerRef.current = null;
      rootRef.current?.unmount();
      rootRef.current = null;
      document.body.removeChild(container);
      containerRef.current = null;
      wrapperRef.current = null;
    };
  }, []);

  useEffect(() => {
    rootRef.current?.render(component);
  }, [component]);

  return dimensions;
}
